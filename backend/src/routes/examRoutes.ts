import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { validate } from '../middleware/validateMiddleware';
import { createExamSchema, enterMarksSchema } from '../validators/schemas';
import { createExam, listExams, enterMarks, getExamMarks } from '../controllers/examController';

const router = Router();

router.use(requireAuth);
router.get('/', requireRole('ADMIN', 'TEACHER'), listExams);
router.post('/', requireRole('ADMIN'), validate(createExamSchema), createExam);
router.get('/:id/marks', requireRole('ADMIN', 'TEACHER'), getExamMarks);
router.post('/:id/marks', requireRole('ADMIN', 'TEACHER'), validate(enterMarksSchema), enterMarks);

export default router;
