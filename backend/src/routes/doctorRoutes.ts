import { Router } from 'express';
import { recommendDoctors } from '../controllers/doctorController.js';

const router = Router();

router.post('/recommend', recommendDoctors);

export default router;
