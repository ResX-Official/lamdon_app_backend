import { Router } from 'express';
import { register, login, confirmEmail, resendCode, adminLogin, createAdmin } from '../controllers/authController';

const router = Router();

router.post('/signup', register);
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.post('/create-admin', createAdmin);
router.post('/confirm-email', confirmEmail);
router.post('/resend-code', resendCode);

export default router;