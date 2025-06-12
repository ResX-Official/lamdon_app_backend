import { Request, Response } from 'express';
import axios from 'axios';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

export const initializePayment = async (req: Request, res: Response) => {
  try {
    const { email, amount } = req.body;
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amount * 100 // Paystack expects amount in kobo
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json(response.data);
  } catch (err: any) {
    res.status(500).json({ message: 'Payment initialization failed', error: err.response?.data || err.message });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`
        }
      }
    );
    res.json(response.data);
  } catch (err: any) {
    res.status(500).json({ message: 'Payment verification failed', error: err.response?.data || err.message });
  }
};