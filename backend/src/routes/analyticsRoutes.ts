import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { getOverview, getSemesterAnalytics, getBatchComparison, getStudentAnalyticsAdmin } from '../controllers/analyticsController';

const router = Router();

router.use(requireAuth);
router.get('/overview', requireRole('ADMIN'), getOverview);
router.get('/semester/:id', requireRole('ADMIN', 'TEACHER'), getSemesterAnalytics);
router.get('/batch/:id', requireRole('ADMIN', 'TEACHER'), getBatchComparison);
router.get('/student/:id', requireRole('ADMIN', 'TEACHER'), getStudentAnalyticsAdmin);

export default router;
