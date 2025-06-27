import { Router } from 'express';
import { 
  initializePayment, 
  verifyPayment, 
  getBanks, 
  verifyBankAccount, 
  createTransferRecipient, 
  initiateTransfer,
  getPaystackKeys
} from '../controllers/paymentController';
import { authenticateToken as auth } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/config/paystack-keys', getPaystackKeys);

// Protected routes (require authentication)
router.post('/initialize', auth, initializePayment);
router.get('/verify/:reference', auth, verifyPayment);
router.get('/banks', auth, getBanks);
router.post('/verify-account', auth, verifyBankAccount);
router.post('/create-recipient', auth, createTransferRecipient);
router.post('/initiate-transfer', auth, initiateTransfer);

export default router;