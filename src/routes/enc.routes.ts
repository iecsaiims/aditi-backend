import { Router } from 'express';
import { fetchEncRecord, storeEncConsultation, storeEncDisposition } from '../controllers/enc.controller';

const router = Router();

router.get('/:patientId', fetchEncRecord);
router.post('/:patientId/consultations', storeEncConsultation);
router.post('/:patientId/disposition', storeEncDisposition);

export default router;
