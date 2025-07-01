import axios from 'axios';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export async function createTransferRecipient({ name, account_number, bank_code }: { name: string, account_number: string, bank_code: string }) {
  const response = await axios.post(
    `${PAYSTACK_BASE_URL}/transferrecipient`,
    {
      type: 'nuban',
      name,
      account_number,
      bank_code,
      currency: 'NGN',
    },
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data.data.recipient_code;
}

export async function initiateTransfer({ amount, recipient, reason }: { amount: number, recipient: string, reason?: string }) {
  const response = await axios.post(
    `${PAYSTACK_BASE_URL}/transfer`,
    {
      source: 'balance',
      amount, // in kobo
      recipient,
      reason: reason || 'Lamdon withdrawal',
      currency: 'NGN',
    },
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data.data;
} 