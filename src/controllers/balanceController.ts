import { Request, Response } from 'express';
import { User } from '../models/user';
import { Transaction } from '../models/transaction';
import { createTransferRecipient, initiateTransfer } from '../utils/paystack';

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
    // Check for bank details
    if (!user.bankAccountNumber || !user.bankCode) {
      return res.status(400).json({ message: 'Bank details not set' });
    }
    // Calculate admin fee and payout amount
    const adminFee = Math.round(amount * 0.02);
    const payoutAmount = amount - adminFee;
    // Ensure Paystack recipient code exists
    let recipientCode = user.paystackRecipientCode;
    if (!recipientCode) {
      recipientCode = await createTransferRecipient({
        name: `${user.firstName} ${user.lastName}`,
        account_number: user.bankAccountNumber!,
        bank_code: user.bankCode!,
      });
      user.paystackRecipientCode = recipientCode;
      await user.save();
    }
    if (!recipientCode) {
      throw new Error('Failed to obtain Paystack recipient code');
    }
    // Initiate Paystack transfer (amount in kobo)
    const transfer = await initiateTransfer({
      amount: payoutAmount * 100,
      recipient: recipientCode,
      reason: 'Lamdon host withdrawal',
    });
    // Deduct full amount from balance
    user.balance -= amount;
    await user.save();
    // Record withdrawal transaction (pending)
    await Transaction.create({
      user: user._id,
      type: 'withdraw',
      amount: payoutAmount,
      status: 'pending',
      paymentMethod: 'bank_transfer',
      reference: transfer.reference,
      adminNotes: `2% admin fee: ₦${adminFee}`
    });
    // Record admin fee as commission
    await Transaction.create({
      user: user._id,
      type: 'commission',
      amount: adminFee,
      status: 'success',
      adminNotes: 'Admin fee for withdrawal'
    });
    res.json({ balance: user.balance, payoutAmount, adminFee, transfer });
  } catch (err) {
    await Transaction.create({ user: req.params.userId, type: 'withdraw', amount: req.body.amount, status: 'failed', adminNotes: 'Withdrawal error' });
    res.status(500).json({ message: 'Error withdrawing balance', error: err instanceof Error ? err.message : err });
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