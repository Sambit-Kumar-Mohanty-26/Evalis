"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const institutionController_1 = require("../controllers/institutionController");
const router = (0, express_1.Router)();
// Route: GET /api/v1/institutions/lookup
router.get('/lookup', institutionController_1.lookupInstitution);
exports.default = router;
