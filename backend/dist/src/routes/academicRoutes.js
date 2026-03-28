"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const academicController_1 = require("../controllers/academicController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// This creates the "/structure" part of the URL
router.get('/structure', authMiddleware_1.requireAuth, academicController_1.getAcademicStructure);
exports.default = router;
