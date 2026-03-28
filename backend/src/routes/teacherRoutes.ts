import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { validate } from '../middleware/validateMiddleware';
import { assignTeacherSchema } from '../validators/schemas';
import { assignTeacher, getAssignments, removeAssignment } from '../controllers/teacherController';

const router = Router();

router.use(requireAuth);
router.get('/assignments', requireRole('ADMIN', 'TEACHER'), getAssignments);
router.post('/assignments', requireRole('ADMIN'), validate(assignTeacherSchema), assignTeacher);
router.delete('/assignments/:id', requireRole('ADMIN'), removeAssignment);

export default router;
