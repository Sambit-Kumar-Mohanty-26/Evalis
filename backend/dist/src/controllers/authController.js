"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refreshToken = exports.login = exports.verifyOtp = exports.sendOtp = void 0;
const db_1 = require("../config/db");
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const nodejs_1 = __importDefault(require("@emailjs/nodejs")); // <-- Imported EmailJS Node SDK
const bcrypt_1 = __importDefault(require("bcrypt"));
// Helper: Ultra-fast SHA-256 hashing for tokens
const hashToken = (token) => crypto_1.default.createHash('sha256').update(token).digest('hex');
const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }
        // 1. Enforce 30-Second Cooldown (Rate Limiting)
        const lastOtp = await db_1.db.otpVerification.findFirst({
            where: { email },
            orderBy: { createdAt: 'desc' }
        });
        if (lastOtp && (Date.now() - lastOtp.lastSentAt.getTime() < 30000)) {
            res.status(429).json({ error: 'Please wait 30 seconds before requesting a new OTP.' });
            return;
        }
        // 2. Invalidate all previous OTPs for this email (Append-only approach)
        await db_1.db.otpVerification.updateMany({
            where: { email, isUsed: false },
            data: { isUsed: true }
        });
        // 3. Generate 6-digit OTP & Hash it
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = hashToken(otp);
        // 4. Save to Database
        await db_1.db.otpVerification.create({
            data: {
                email,
                otpHash,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), // Expires in 5 minutes
            }
        });
        // 5. Send Email via EmailJS
        console.log(`\n=========================================`);
        console.log(`🔐 DEV OTP CODE FOR ${email}: [ ${otp} ]`);
        console.log(`=========================================\n`);
        // Ensure your environment variables are set before trying to send
        if (process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_TEMPLATE_ID) {
            await nodejs_1.default.send(process.env.EMAILJS_SERVICE_ID, process.env.EMAILJS_TEMPLATE_ID, {
                // Make sure these match the {{variables}} in your EmailJS Template!
                to_email: email,
                otp_code: otp,
                reply_to: "support@evalis.io"
            }, {
                publicKey: process.env.EMAILJS_PUBLIC_KEY,
                privateKey: process.env.EMAILJS_PRIVATE_KEY, // Required for backend usage
            });
            console.log(`📧 Email sent successfully via EmailJS!`);
        }
        else {
            console.log(`⚠️ EmailJS keys not found in .env, skipping actual email send.`);
        }
        res.status(200).json({ message: 'OTP sent successfully.' });
    }
    catch (error) {
        console.error('Send OTP Error:', error);
        res.status(500).json({ error: 'Failed to send OTP.' });
    }
};
exports.sendOtp = sendOtp;
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            res.status(400).json({ error: 'Email and OTP are required.' });
            return;
        }
        // 1. Find the latest unused OTP for this email
        const activeOtp = await db_1.db.otpVerification.findFirst({
            where: { email, isUsed: false },
            orderBy: { createdAt: 'desc' }
        });
        if (!activeOtp) {
            res.status(400).json({ error: 'No active OTP found. Please request a new one.' });
            return;
        }
        // 2. Check Expiration
        if (Date.now() > activeOtp.expiresAt.getTime()) {
            await db_1.db.otpVerification.update({ where: { id: activeOtp.id }, data: { isUsed: true } });
            res.status(400).json({ error: 'OTP has expired.' });
            return;
        }
        // 3. Brute-Force Protection (Max 3 attempts)
        if (activeOtp.attemptCount >= 3) {
            await db_1.db.otpVerification.update({ where: { id: activeOtp.id }, data: { isUsed: true } });
            res.status(403).json({ error: 'Too many failed attempts. Please request a new OTP.' });
            return;
        }
        // 4. Verify Hash
        const inputHash = hashToken(otp);
        if (inputHash !== activeOtp.otpHash) {
            // Increment attempt count
            await db_1.db.otpVerification.update({
                where: { id: activeOtp.id },
                data: { attemptCount: { increment: 1 } }
            });
            res.status(401).json({ error: 'Invalid OTP.' });
            return;
        }
        // 5. Success! Mark as used.
        await db_1.db.otpVerification.update({ where: { id: activeOtp.id }, data: { isUsed: true } });
        // 6. Issue a temporary "Pre-Onboarding Token"
        const preAuthToken = jsonwebtoken_1.default.sign({ email, verified: true }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30m' });
        res.status(200).json({
            message: 'Email verified successfully.',
            preAuthToken
        });
    }
    catch (error) {
        console.error('Verify OTP Error:', error);
        res.status(500).json({ error: 'Internal Server Error.' });
    }
};
exports.verifyOtp = verifyOtp;
// --- ADD THESE TO THE BOTTOM OF authController.ts ---
// Helper: Generate a completely random cryptographically secure token
const generateRefreshToken = () => crypto_1.default.randomBytes(40).toString('hex');
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // 1. Find User & Include Tenant Data
        const user = await db_1.db.user.findUnique({
            where: { email },
            include: { tenant: true }
        });
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password.' });
            return;
        }
        // 2. Verify Password
        const isValid = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!isValid) {
            res.status(401).json({ error: 'Invalid email or password.' });
            return;
        }
        // 3. Generate Tokens
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role, tenantId: user.tenantId }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '15m' } // Short-lived Access Token
        );
        const plainRefreshToken = generateRefreshToken();
        const tokenHash = hashToken(plainRefreshToken);
        // 4. Save Refresh Token Hash to DB (Device Tracking)
        await db_1.db.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash,
                ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
                userAgent: req.headers['user-agent'] || 'unknown',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 Days
            }
        });
        // 5. Send Refresh Token as a Secure HttpOnly Cookie
        res.cookie('refresh_token', plainRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Days
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
    }
    catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.login = login;
const refreshToken = async (req, res) => {
    try {
        const rawToken = req.cookies.refresh_token;
        if (!rawToken) {
            res.status(401).json({ error: 'No refresh token provided.' });
            return;
        }
        const tokenHash = hashToken(rawToken);
        // 1. Find the token in the DB
        const activeToken = await db_1.db.refreshToken.findUnique({
            where: { tokenHash },
            include: { user: true }
        });
        if (!activeToken) {
            res.status(401).json({ error: 'Invalid refresh token.' });
            return;
        }
        // 2. THEFT DETECTION (Token Rotation Security)
        if (activeToken.revoked) {
            // A revoked token was just used! This means a hacker stole it and is trying to replay it.
            // NUKE ALL SESSIONS for this user to protect their account.
            await db_1.db.refreshToken.updateMany({
                where: { userId: activeToken.userId },
                data: { revoked: true }
            });
            res.clearCookie('refresh_token');
            res.status(403).json({ error: 'Security breach detected. All sessions revoked. Please log in again.' });
            return;
        }
        // 3. Check Expiration
        if (Date.now() > activeToken.expiresAt.getTime()) {
            await db_1.db.refreshToken.update({ where: { id: activeToken.id }, data: { revoked: true } });
            res.status(401).json({ error: 'Refresh token expired.' });
            return;
        }
        // 4. ROTATE TOKEN (Invalidate old, issue new)
        await db_1.db.refreshToken.update({ where: { id: activeToken.id }, data: { revoked: true } });
        const newPlainToken = generateRefreshToken();
        const newTokenHash = hashToken(newPlainToken);
        await db_1.db.refreshToken.create({
            data: {
                userId: activeToken.userId,
                tokenHash: newTokenHash,
                ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
                userAgent: req.headers['user-agent'] || 'unknown',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });
        // 5. Issue new Access Token
        const newAccessToken = jsonwebtoken_1.default.sign({ userId: activeToken.user.id, role: activeToken.user.role, tenantId: activeToken.user.tenantId }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '15m' });
        // Set the new cookie
        res.cookie('refresh_token', newPlainToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.status(200).json({ accessToken: newAccessToken });
    }
    catch (error) {
        console.error('Refresh Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.refreshToken = refreshToken;
const logout = async (req, res) => {
    try {
        const rawToken = req.cookies.refresh_token;
        if (rawToken) {
            const tokenHash = hashToken(rawToken);
            // Revoke the specific device session in the database
            await db_1.db.refreshToken.updateMany({
                where: { tokenHash },
                data: { revoked: true }
            });
        }
        // Destroy the cookie
        res.clearCookie('refresh_token');
        res.status(200).json({ message: 'Logged out successfully.' });
    }
    catch (error) {
        console.error('Logout Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.logout = logout;
