import { Router } from 'express';
import { getBalance, addBalance, withdrawBalance, getTransactionHistory } from '../controllers/balanceController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All balance routes require authentication
router.use(authenticateToken);

router.get('/:userId', getBalance);
router.post('/:userId/add', addBalance);
router.post('/:userId/withdraw', withdrawBalance);
router.get('/:userId/history', getTransactionHistory);

export default router; 