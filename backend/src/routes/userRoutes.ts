import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { validate } from '../middleware/validateMiddleware';
import { createUserSchema, updateUserSchema, bulkUploadStudentsSchema, paginationSchema } from '../validators/schemas';
import { listUsers, createUser, getUser, updateUser, deleteUser, bulkUploadStudents } from '../controllers/userController';

const router = Router();
router.use(requireAuth);
router.get('/', requireRole('ADMIN', 'TEACHER'), validate(paginationSchema, 'query'), listUsers);
router.post('/', requireRole('ADMIN'), validate(createUserSchema), createUser);
router.post('/bulk-upload', requireRole('ADMIN'), validate(bulkUploadStudentsSchema), bulkUploadStudents);
router.get('/:id', requireRole('ADMIN'), getUser);
router.put('/:id', requireRole('ADMIN'), validate(updateUserSchema), updateUser);
router.delete('/:id', requireRole('ADMIN'), deleteUser);

export default router;
