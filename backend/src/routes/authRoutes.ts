import { Router } from 'express';
import { login, registerStaff, getCurrentUser } from '../controllers/authController.js';
import { authenticateToken, requireRoles } from '../middleware/auth.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.post('/login', login);
router.post('/register', authenticateToken, requireRoles([UserRole.ADMIN]), registerStaff);
router.get('/me', authenticateToken, getCurrentUser);

export default router;
