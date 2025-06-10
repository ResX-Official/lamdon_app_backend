import { Router } from 'express';
import { register, login, confirmEmail } from '../controllers/authController';

const router = Router();

router.post('/signup', register);
router.post('/login', login);
router.post('/confirm-email', confirmEmail);

export default router;