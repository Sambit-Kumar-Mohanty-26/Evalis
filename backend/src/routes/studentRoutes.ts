import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { getStudentDashboard, getStudentMarks, getStudentAnalytics } from '../controllers/studentController';

const router = Router();

router.use(requireAuth);
router.use(requireRole('STUDENT'));
router.get('/me/dashboard', getStudentDashboard);
router.get('/me/marks', getStudentMarks);
router.get('/me/analytics', getStudentAnalytics);

export default router;
