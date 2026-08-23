import { Router } from 'express';
import { getFollowUps, updateFollowUpStatus } from '../controllers/followUpController.js';

const router = Router();

router.get('/', getFollowUps);
router.put('/:followUpId/status', updateFollowUpStatus);

export default router;
