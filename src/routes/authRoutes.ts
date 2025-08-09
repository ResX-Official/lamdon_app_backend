import { Router } from 'express';
import { register, login, confirmEmail, resendCode, adminLogin, createAdmin, forgotPassword, resetPassword } from '../controllers/authController';

const router = Router();

router.post('/signup', register);
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.post('/admin/forgot-password', forgotPassword);
router.post('/admin/reset-password', resetPassword);
router.post('/create-admin', createAdmin);
router.post('/confirm-email', confirmEmail);
router.post('/resend-code', resendCode);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;