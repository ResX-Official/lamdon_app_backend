import { Request, Response } from 'express';
import axios from 'axios';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC = process.env.PAYSTACK_PUBLIC_KEY;

// Get Paystack API keys (for frontend)
export const getPaystackKeys = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      secretKey: PAYSTACK_SECRET,
      publicKey: PAYSTACK_PUBLIC
    });
  } catch (err: any) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to get Paystack keys', 
      error: err.message 
    });
  }
};

export const initializePayment = async (req: Request, res: Response) => {
  try {
    const { email, amount, reference } = req.body;
    
    if (!email || !amount) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and amount are required' 
      });
    }

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: Math.round(amount * 100), // Paystack expects amount in kobo
        reference: reference || `LAMDON_${Date.now()}`,
        callback_url: `${process.env.BACKEND_URL || 'https://lamdon-app-backend.onrender.com'}/api/payment/verify`,
        currency: 'NGN'
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      data: response.data.data
    });
  } catch (err: any) {
    console.error('Payment initialization error:', err.response?.data || err.message);
    res.status(500).json({ 
      success: false,
      message: 'Payment initialization failed', 
      error: err.response?.data?.message || err.message 
    });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;
    
    if (!reference) {
      return res.status(400).json({ 
        success: false,
        message: 'Reference is required' 
      });
    }

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`
        }
      }
    );

    const transaction = response.data.data;
    
    // If payment is successful, update user balance
    if (transaction.status === 'success') {
      // TODO: Update user balance in database
      // const userId = req.user.id;
      // await updateUserBalance(userId, transaction.amount / 100);
    }

    res.json({
      success: true,
      data: {
        ...transaction,
        amount: transaction.amount / 100 // Convert back to naira
      }
    });
  } catch (err: any) {
    console.error('Payment verification error:', err.response?.data || err.message);
    res.status(500).json({ 
      success: false,
      message: 'Payment verification failed', 
      error: err.response?.data?.message || err.message 
    });
  }
};

// Get list of banks
export const getBanks = async (req: Request, res: Response) => {
  try {
    const response = await axios.get(
      'https://api.paystack.co/bank',
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`
        }
      }
    );

    res.json({
      success: true,
      data: response.data.data
    });
  } catch (err: any) {
    console.error('Get banks error:', err.response?.data || err.message);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get banks', 
      error: err.response?.data?.message || err.message 
    });
  }
};

// Verify bank account
export const verifyBankAccount = async (req: Request, res: Response) => {
  try {
    const { account_number, bank_code } = req.body;
    
    if (!account_number || !bank_code) {
      return res.status(400).json({ 
        success: false,
        message: 'Account number and bank code are required' 
      });
    }

    const response = await axios.get(
      `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`
        }
      }
    );

    res.json({
      success: true,
      data: response.data.data
    });
  } catch (err: any) {
    console.error('Bank verification error:', err.response?.data || err.message);
    res.status(500).json({ 
      success: false,
      message: 'Failed to verify bank account', 
      error: err.response?.data?.message || err.message 
    });
  }
};

// Create transfer recipient
export const createTransferRecipient = async (req: Request, res: Response) => {
  try {
    const { account_number, bank_code, name } = req.body;
    
    if (!account_number || !bank_code || !name) {
      return res.status(400).json({ 
        success: false,
        message: 'Account number, bank code, and name are required' 
      });
    }

    const response = await axios.post(
      'https://api.paystack.co/transferrecipient',
      {
        type: 'nuban',
        name,
        account_number,
        bank_code,
        currency: 'NGN'
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      data: response.data.data
    });
  } catch (err: any) {
    console.error('Create recipient error:', err.response?.data || err.message);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create transfer recipient', 
      error: err.response?.data?.message || err.message 
    });
  }
};

// Initiate transfer
export const initiateTransfer = async (req: Request, res: Response) => {
  try {
    const { recipient_code, amount, reason } = req.body;
    
    if (!recipient_code || !amount) {
      return res.status(400).json({ 
        success: false,
        message: 'Recipient code and amount are required' 
      });
    }

    const response = await axios.post(
      'https://api.paystack.co/transfer',
      {
        source: 'balance',
        amount: Math.round(amount * 100), // Convert to kobo
        recipient: recipient_code,
        reason: reason || 'Withdrawal from Lamdon wallet',
        currency: 'NGN'
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      data: response.data.data
    });
  } catch (err: any) {
    console.error('Transfer initiation error:', err.response?.data || err.message);
    res.status(500).json({ 
      success: false,
      message: 'Failed to initiate transfer', 
      error: err.response?.data?.message || err.message 
    });
  }
};

export const paystackWebhook = async (req: Request, res: Response) => {
  const event = req.body;
  if (event.event === 'charge.success') {
    const reference = event.data.reference;
    // Find booking by reference, mark as paid, credit host, etc.
  }
  res.sendStatus(200);
}; 