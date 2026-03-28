"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const onboardController_1 = require("../controllers/onboardController");
// Add the new imports
const authController_2 = require("../controllers/authController");
const router = (0, express_1.Router)();
router.post('/send-otp', authController_1.sendOtp);
router.post('/verify-otp', authController_1.verifyOtp);
router.post('/onboard', onboardController_1.onboardInstitution);
// The new Login, Refresh, and Logout routes!
router.post('/login', authController_2.login);
router.post('/refresh', authController_2.refreshToken);
router.post('/logout', authController_2.logout);
exports.default = router;
