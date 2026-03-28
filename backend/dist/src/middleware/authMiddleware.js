"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const requireAuth = (req, res, next) => {
    try {
        // 1. Extract Token from "Authorization: Bearer <token>"
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Unauthorized. No access token provided.' });
            return;
        }
        const token = authHeader.split(' ')[1];
        // 2. Verify the Token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        // 3. Attach User Data to Request
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Unauthorized. Invalid or expired token.' });
    }
};
exports.requireAuth = requireAuth;
