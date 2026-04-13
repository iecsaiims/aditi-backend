import { Router } from 'express';
import { listPatients, storePatient } from '../controllers/patient.controller';
import { requireAuth } from '../middlewares/requireAuth';

const router = Router();

router.get('/', requireAuth, listPatients);
router.post('/', requireAuth, storePatient);

export default router;
