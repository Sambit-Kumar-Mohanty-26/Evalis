import { Router } from 'express';
import { getAcademicStructure } from '../controllers/academicController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();
router.get('/structure', requireAuth, getAcademicStructure);

export default router;