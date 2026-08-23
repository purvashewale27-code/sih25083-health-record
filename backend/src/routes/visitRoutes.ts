import { Router } from 'express';
import { getVisits, getVisitById, createVisit } from '../controllers/visitController.js';

const router = Router();

router.get('/', getVisits);
router.post('/', createVisit);
router.get('/:id', getVisitById);

export default router;
