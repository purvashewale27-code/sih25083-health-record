import { Router } from 'express';
import {
  getAppointments,
  getAvailableSlots,
  createAppointment,
  updateAppointmentStatus,
} from '../controllers/appointmentController.js';

const router = Router();

router.get('/', getAppointments);
router.get('/slots', getAvailableSlots);
router.post('/', createAppointment);
router.put('/:id/status', updateAppointmentStatus);

export default router;
