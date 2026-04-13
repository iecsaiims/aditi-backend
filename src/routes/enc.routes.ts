import { Router } from 'express';
import { fetchEncRecord, storeEncConsultation, storeEncDisposition } from '../controllers/enc.controller';
import { requireAuth } from '../middlewares/requireAuth';

const router = Router();

router.use(requireAuth);
router.get('/:patientId', fetchEncRecord);
router.post('/:patientId/consultations', storeEncConsultation);
router.post('/:patientId/disposition', storeEncDisposition);

export default router;
