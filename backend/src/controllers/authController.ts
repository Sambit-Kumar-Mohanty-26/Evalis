import { Request, Response } from 'express';
import { db } from '../config/db';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import emailjs from '@emailjs/nodejs';
import bcrypt from 'bcrypt';

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    //Enforce 30-Second Cooldown (Rate Limiting)
    const lastOtp = await db.otpVerification.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' }
    });

    if (lastOtp && (Date.now() - lastOtp.lastSentAt.getTime() < 30000)) {
      res.status(429).json({ error: 'Please wait 30 seconds before requesting a new OTP.' });
      return;
    }

    // Invalidate all previous OTPs for this email (Append-only approach)
    await db.otpVerification.updateMany({
      where: { email, isUsed: false },
      data: { isUsed: true }
    });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = hashToken(otp);

    await db.otpVerification.create({
      data: {
        email,
        otpHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      }
    });

    console.log(`🔐 DEV OTP CODE FOR ${email}: [ ${otp} ]`);

    if (process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_TEMPLATE_ID) {
      await emailjs.send(
        process.env.EMAILJS_SERVICE_ID,
        process.env.EMAILJS_TEMPLATE_ID,
        {
          to_email: email, 
          otp_code: otp,
          reply_to: "support@evalis.io"
        },
        {
          publicKey: process.env.EMAILJS_PUBLIC_KEY,
          privateKey: process.env.EMAILJS_PRIVATE_KEY,
        }
      );
      console.log(`📧 Email sent successfully via EmailJS!`);
    } else {
      console.log(`⚠️ EmailJS keys not found in .env, skipping actual email send.`);
    }

    res.status(200).json({ message: 'OTP sent successfully.' });
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ error: 'Failed to send OTP.' });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400).json({ error: 'Email and OTP are required.' });
      return;
    }

    const activeOtp = await db.otpVerification.findFirst({
      where: { email, isUsed: false },
      orderBy: { createdAt: 'desc' }
    });

    if (!activeOtp) {
      res.status(400).json({ error: 'No active OTP found. Please request a new one.' });
      return;
    }

    if (Date.now() > activeOtp.expiresAt.getTime()) {
      await db.otpVerification.update({ where: { id: activeOtp.id }, data: { isUsed: true } });
      res.status(400).json({ error: 'OTP has expired.' });
      return;
    }

    if (activeOtp.attemptCount >= 3) {
      await db.otpVerification.update({ where: { id: activeOtp.id }, data: { isUsed: true } });
      res.status(403).json({ error: 'Too many failed attempts. Please request a new OTP.' });
      return;
    }

    const inputHash = hashToken(otp);
    if (inputHash !== activeOtp.otpHash) {
      await db.otpVerification.update({
        where: { id: activeOtp.id },
        data: { attemptCount: { increment: 1 } }
      });
      res.status(401).json({ error: 'Invalid OTP.' });
      return;
    }

    await db.otpVerification.update({ where: { id: activeOtp.id }, data: { isUsed: true } });

    const preAuthToken = jwt.sign(
      { email, verified: true },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '30m' } 
    );

    res.status(200).json({ 
      message: 'Email verified successfully.',
      preAuthToken 
    });

  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ error: 'Internal Server Error.' });
  }
};

const generateRefreshToken = () => crypto.randomBytes(40).toString('hex');

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await db.user.findUnique({
      where: { email },
      include: { tenant: true }
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role, tenantId: user.tenantId },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '15m' }
    );

    const plainRefreshToken = generateRefreshToken();
    const tokenHash = hashToken(plainRefreshToken);

    await db.refreshToken.create({
      data: {
        userId: user.id,
        tenantId: user.tenantId,
        tokenHash,
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    res.cookie('refresh_token', plainRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        tenantId: user.tenantId
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawToken = req.cookies.refresh_token;

    if (!rawToken) {
      res.status(401).json({ error: 'No refresh token provided.' });
      return;
    }

    const tokenHash = hashToken(rawToken);

    const activeToken = await db.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!activeToken) {
      res.status(401).json({ error: 'Invalid refresh token.' });
      return;
    }

    if (activeToken.revoked) {
      await db.refreshToken.updateMany({
        where: { userId: activeToken.userId },
        data: { revoked: true }
      });
      res.clearCookie('refresh_token');
      res.status(403).json({ error: 'Security breach detected. All sessions revoked. Please log in again.' });
      return;
    }

    if (Date.now() > activeToken.expiresAt.getTime()) {
      await db.refreshToken.update({ where: { id: activeToken.id }, data: { revoked: true } });
      res.status(401).json({ error: 'Refresh token expired.' });
      return;
    }

    await db.refreshToken.update({ where: { id: activeToken.id }, data: { revoked: true } });

    const newPlainToken = generateRefreshToken();
    const newTokenHash = hashToken(newPlainToken);

    await db.refreshToken.create({
      data: {
        userId: activeToken.userId,
        tenantId: activeToken.user.tenantId,
        tokenHash: newTokenHash,
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    const newAccessToken = jwt.sign(
      { userId: activeToken.user.id, role: activeToken.user.role, tenantId: activeToken.user.tenantId },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '15m' }
    );

    res.cookie('refresh_token', newPlainToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({ accessToken: newAccessToken });

  } catch (error) {
    console.error('Refresh Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawToken = req.cookies.refresh_token;
    if (rawToken) {
      const tokenHash = hashToken(rawToken);
      await db.refreshToken.updateMany({
        where: { tokenHash },
        data: { revoked: true }
      });
    }
    
    res.clearCookie('refresh_token');
    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};