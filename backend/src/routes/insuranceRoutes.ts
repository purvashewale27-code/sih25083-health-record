import { Router } from 'express';
import { getSchemes, checkPatientEligibility } from '../controllers/insuranceController.js';

const router = Router();

router.get('/schemes', getSchemes);
router.get('/eligibility/:patientId', checkPatientEligibility);

export default router;
