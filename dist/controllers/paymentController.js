"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPayment = exports.initializePayment = void 0;
const axios_1 = __importDefault(require("axios"));
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const initializePayment = async (req, res) => {
    try {
        const { email, amount } = req.body;
        const response = await axios_1.default.post('https://api.paystack.co/transaction/initialize', {
            email,
            amount: amount * 100 // Paystack expects amount in kobo
        }, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET}`,
                'Content-Type': 'application/json'
            }
        });
        res.json(response.data);
    }
    catch (err) {
        res.status(500).json({ message: 'Payment initialization failed', error: err.response?.data || err.message });
    }
};
exports.initializePayment = initializePayment;
const verifyPayment = async (req, res) => {
    try {
        const { reference } = req.params;
        const response = await axios_1.default.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET}`
            }
        });
        res.json(response.data);
    }
    catch (err) {
        res.status(500).json({ message: 'Payment verification failed', error: err.response?.data || err.message });
    }
};
exports.verifyPayment = verifyPayment;
