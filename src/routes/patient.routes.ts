import { Router } from 'express';
import { listPatients, storePatient } from '../controllers/patient.controller';

const router = Router();

router.get('/', listPatients);
router.post('/', storePatient);

export default router;
