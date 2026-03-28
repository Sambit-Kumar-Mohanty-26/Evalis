"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
// 1. Import BOTH Routes here
const institutionRoutes_1 = __importDefault(require("./routes/institutionRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const academicRoutes_1 = __importDefault(require("./routes/academicRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// REQ-SEC-005: Security Headers
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});
// REQ-SEC-003: CORS Policy
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true // Required to allow HTTP-only cookies
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// REQ-AUTH-008: Rate limiting for Authentication endpoints
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // Limit each IP to 20 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again after a minute.' }
});
// Apply rate limiter strictly to auth routes (Updated path to match v1)
app.use('/api/v1/auth', authLimiter);
// Health Check Endpoint (Tests server and database)
app.get('/api/health', async (req, res) => {
    try {
        const result = await db_1.db.$queryRaw `SELECT NOW() AS current_time`;
        res.status(200).json({
            status: 'SPARS API is running smoothly',
            db_time: result
        });
    }
    catch (error) {
        console.error('DB Connection Error:', error);
        res.status(500).json({ error: 'Database connection failed' });
    }
});
// ==========================================
// MOUNT API ROUTES
// ==========================================
app.use('/api/v1/institutions', institutionRoutes_1.default);
app.use('/api/v1/auth', authRoutes_1.default); // 2. Mount the Auth routes here!
app.use('/api/v1/academic', academicRoutes_1.default);
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
