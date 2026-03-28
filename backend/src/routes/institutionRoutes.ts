import { Router } from 'express';
import { lookupInstitution } from '../controllers/institutionController';

const router = Router();
router.get('/lookup', lookupInstitution);

export default router;