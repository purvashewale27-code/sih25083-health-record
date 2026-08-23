import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import userRoutes from './userRoutes.js';
import facilityRoutes from './facilityRoutes.js';
import patientRoutes from './patientRoutes.js';
import visitRoutes from './visitRoutes.js';
import prescriptionRoutes from './prescriptionRoutes.js';
import followUpRoutes from './followUpRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/users', userRoutes);
router.use('/facilities', facilityRoutes);
router.use('/patients', patientRoutes);
router.use('/visits', visitRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/followups', followUpRoutes);

export default router;
