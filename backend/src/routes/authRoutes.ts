import { Router } from 'express';
import { sendOtp, verifyOtp } from '../controllers/authController';
import { onboardInstitution } from '../controllers/onboardController';
import { login, refreshToken, logout } from '../controllers/authController';

const router = Router();

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/onboard', onboardInstitution);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

export default router;