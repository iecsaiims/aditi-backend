import { Router } from 'express';
import { createStaff, login } from '../controllers/auth.controller';
import { requireAdmin } from '../middlewares/requireAdmin';
import { requireAuth } from '../middlewares/requireAuth';

const router = Router();

router.post('/login', login);
router.post('/staff', requireAuth, requireAdmin, createStaff);

export default router;
