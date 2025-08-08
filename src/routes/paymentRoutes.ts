import { Router } from 'express';
import { 
  initializePayment, 
  verifyPayment, 
  getBanks, 
  verifyBankAccount, 
  createTransferRecipient, 
  initiateTransfer,
  getPaystackKeys,
  paystackWebhook,
  initializeBookingPayment,
  verifyBookingPayment,
  withdrawFunds
} from '../controllers/paymentController';
import { authenticateToken as auth } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/config/paystack-keys', getPaystackKeys);

// Protected routes (require authentication)
router.post('/initialize', auth, initializePayment);
router.get('/verify/:reference', auth, verifyPayment);
router.post('/booking/initialize', auth, initializeBookingPayment);
router.get('/booking/verify/:reference', verifyBookingPayment); // No auth needed for webhook verification
router.get('/banks', auth, getBanks);
router.post('/verify-account', auth, verifyBankAccount);
router.post('/create-recipient', auth, createTransferRecipient);
router.post('/initiate-transfer', auth, initiateTransfer);
router.post('/withdraw', auth, withdrawFunds);
router.post('/webhook', paystackWebhook);

export default router;