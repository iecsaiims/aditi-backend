import { Router } from 'express';
import { createStaff, createStaffBatch, login, updatePassword } from '../controllers/auth.controller';
import { requireAdmin } from '../middlewares/requireAdmin';
import { requireAuth } from '../middlewares/requireAuth';

const router = Router();

router.post('/login', login);
router.post('/staff', requireAuth, requireAdmin, createStaff);
router.post('/staff/batch', requireAuth, requireAdmin, createStaffBatch);
router.post('/change-password', requireAuth, updatePassword);

export default router;
