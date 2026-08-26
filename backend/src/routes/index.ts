import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import facilityRoutes from './facilityRoutes.js';
import patientRoutes from './patientRoutes.js';
import visitRoutes from './visitRoutes.js';
import prescriptionRoutes from './prescriptionRoutes.js';
import followUpRoutes from './followUpRoutes.js';
import appointmentRoutes from './appointmentRoutes.js';
import doctorRoutes from './doctorRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import insuranceRoutes from './insuranceRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/facilities', facilityRoutes);
router.use('/patients', patientRoutes);
router.use('/visits', visitRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/followups', followUpRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/doctors', doctorRoutes);
router.use('/payments', paymentRoutes);
router.use('/insurance', insuranceRoutes);

export default router;
