import { Request, Response } from 'express';
import { User } from '../models/user';
import { Transaction } from '../models/transaction';

// Get user balance
export const getBalance = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ balance: user.balance });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching balance' });
  }
};

// Add balance
export const addBalance = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const { amount } = req.body;
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.balance += amount;
    await user.save();
    await Transaction.create({ user: user._id, type: 'add', amount, status: 'success' });
    res.json({ balance: user.balance });
  } catch (err) {
    await Transaction.create({ user: req.params.userId, type: 'add', amount: req.body.amount, status: 'failed' });
    res.status(500).json({ message: 'Error adding balance' });
  }
};

// Withdraw balance
export const withdrawBalance = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const { amount } = req.body;
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.balance < amount) {
      await Transaction.create({ user: user._id, type: 'withdraw', amount, status: 'failed' });
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    user.balance -= amount;
    await user.save();
    await Transaction.create({ user: user._id, type: 'withdraw', amount, status: 'success' });
    res.json({ balance: user.balance });
  } catch (err) {
    await Transaction.create({ user: req.params.userId, type: 'withdraw', amount: req.body.amount, status: 'failed' });
    res.status(500).json({ message: 'Error withdrawing balance' });
  }
};

// Get transaction history
export const getTransactionHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const transactions = await Transaction.find({ user: userId }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching transaction history' });
  }
}; 