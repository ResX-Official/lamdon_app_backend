"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactionHistory = exports.withdrawBalance = exports.addBalance = exports.getBalance = void 0;
const user_1 = require("../models/user");
const transaction_1 = require("../models/transaction");
// Get user balance
const getBalance = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await user_1.User.findById(userId);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        res.json({ balance: user.balance });
    }
    catch (err) {
        res.status(500).json({ message: 'Error fetching balance' });
    }
};
exports.getBalance = getBalance;
// Add balance
const addBalance = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { amount } = req.body;
        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }
        const user = await user_1.User.findById(userId);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        user.balance += amount;
        await user.save();
        await transaction_1.Transaction.create({ user: user._id, type: 'add', amount, status: 'success' });
        res.json({ balance: user.balance });
    }
    catch (err) {
        await transaction_1.Transaction.create({ user: req.params.userId, type: 'add', amount: req.body.amount, status: 'failed' });
        res.status(500).json({ message: 'Error adding balance' });
    }
};
exports.addBalance = addBalance;
// Withdraw balance
const withdrawBalance = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { amount } = req.body;
        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }
        const user = await user_1.User.findById(userId);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        if (user.balance < amount) {
            await transaction_1.Transaction.create({ user: user._id, type: 'withdraw', amount, status: 'failed' });
            return res.status(400).json({ message: 'Insufficient balance' });
        }
        user.balance -= amount;
        await user.save();
        await transaction_1.Transaction.create({ user: user._id, type: 'withdraw', amount, status: 'success' });
        res.json({ balance: user.balance });
    }
    catch (err) {
        await transaction_1.Transaction.create({ user: req.params.userId, type: 'withdraw', amount: req.body.amount, status: 'failed' });
        res.status(500).json({ message: 'Error withdrawing balance' });
    }
};
exports.withdrawBalance = withdrawBalance;
// Get transaction history
const getTransactionHistory = async (req, res) => {
    try {
        const userId = req.params.userId;
        const transactions = await transaction_1.Transaction.find({ user: userId }).sort({ createdAt: -1 });
        res.json(transactions);
    }
    catch (err) {
        res.status(500).json({ message: 'Error fetching transaction history' });
    }
};
exports.getTransactionHistory = getTransactionHistory;
