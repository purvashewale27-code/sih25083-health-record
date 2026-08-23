import { Router } from 'express';
import { getFacilities, createFacility } from '../controllers/facilityController.js';

const router = Router();

router.get('/', getFacilities);
router.post('/', createFacility);

export default router;
