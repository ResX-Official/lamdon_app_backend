import { Router } from 'express';
import { getBalance, addBalance, withdrawBalance, getTransactionHistory } from '../controllers/balanceController';

const router = Router();

router.get('/:userId', getBalance);
router.post('/:userId/add', addBalance);
router.post('/:userId/withdraw', withdrawBalance);
router.get('/:userId/history', getTransactionHistory);

export default router; 