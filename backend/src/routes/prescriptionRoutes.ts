import { Router } from 'express';
import { getPrescriptions, createPrescription } from '../controllers/prescriptionController.js';

const router = Router();

router.get('/', getPrescriptions);
router.post('/', createPrescription);

export default router;
