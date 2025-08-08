import { Request, Response } from 'express';
import axios from 'axios';
import { Transaction } from '../models/transaction';
import { Booking } from '../models/booking';
import { User } from '../models/user';
import { Property } from '../models/property';
import { Notification } from '../models/notification';
import nodemailer from 'nodemailer';
import { generatePDFReceipt } from '../utils/pdfGenerator';

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

// Initialize booking payment
export const initializeBookingPayment = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    // Get booking details
    const booking = await Booking.findById(bookingId)
      .populate('property', 'title address price host')
      .populate('guest', 'firstName lastName email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.guest._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized - not your booking'
      });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already paid'
      });
    }

    // Create payment reference
    const paymentReference = `LAMDON_BOOKING_${bookingId}_${Date.now()}`;

    // Initialize Paystack payment
    const paystackResponse = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: booking.guest.email,
        amount: Math.round(booking.totalAmount * 100), // Convert to kobo
        reference: paymentReference,
        callback_url: `${process.env.FRONTEND_URL}/payment/success`,
        metadata: {
          bookingId: bookingId,
          userId: userId,
          propertyTitle: booking.property.title,
          propertyAddress: booking.property.address
        },
        currency: 'NGN'
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Update booking with payment reference
    booking.paymentReference = paymentReference;
    booking.paymentStatus = 'pending';
    await booking.save();

    res.json({
      success: true,
      data: {
        authorization_url: paystackResponse.data.data.authorization_url,
        access_code: paystackResponse.data.data.access_code,
        reference: paymentReference
      },
      message: 'Payment initialized successfully'
    });

  } catch (err: any) {
    console.error('Booking payment initialization error:', err.response?.data || err.message);
    res.status(500).json({
      success: false,
      message: 'Payment initialization failed',
      error: err.response?.data?.message || err.message
    });
  }
};

// Verify booking payment
export const verifyBookingPayment = async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Payment reference is required'
      });
    }

    // Verify payment with Paystack
    const paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`
        }
      }
    );

    const transaction = paystackResponse.data.data;

    if (transaction.status === 'success') {
      // Find booking by reference
      const booking = await Booking.findOne({ paymentReference: reference })
        .populate('property', 'title address host')
        .populate('guest', 'firstName lastName email');

      if (booking) {
        // Update booking status
        booking.paymentStatus = 'paid';
        booking.status = 'confirmed';
        await booking.save();

        // Credit host with commission (85% to host, 15% to platform)
        const hostCommission = booking.totalAmount * 0.85;
        const platformFee = booking.totalAmount * 0.15;

        const host = await User.findById(booking.property.host);
        if (host) {
          host.balance += hostCommission;
          await host.save();

          // Create transaction record for host
          await new Transaction({
            user: host._id,
            type: 'commission',
            amount: hostCommission,
            status: 'success',
            reference: reference,
            paymentMethod: 'paystack'
          }).save();
        }

        // Create notifications
        await new Notification({
          recipient: booking.guest._id,
          title: 'Payment Successful',
          message: `Your payment for ${booking.property.title} has been confirmed`,
          type: 'payment',
          relatedBooking: booking._id
        }).save();

        await new Notification({
          recipient: booking.property.host,
          title: 'New Booking Confirmed',
          message: `You have a new confirmed booking for ${booking.property.title}`,
          type: 'booking',
          relatedBooking: booking._id
        }).save();

        // Generate PDF receipt
        try {
          const receiptPath = await generatePDFReceipt({
            bookingId: booking._id.toString(),
            propertyTitle: booking.property.title,
            propertyAddress: booking.property.address,
            guestName: `${booking.guest.firstName} ${booking.guest.lastName}`,
            guestEmail: booking.guest.email,
            checkInDate: booking.checkInDate.toDateString(),
            checkOutDate: booking.checkOutDate.toDateString(),
            totalAmount: booking.totalAmount,
            paymentReference: reference,
            createdAt: booking.createdAt.toDateString()
          });

          // Send confirmation email with receipt
          const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });

          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: booking.guest.email,
            subject: 'Booking Confirmation - Lamdon App',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2E8B57;">Booking Confirmed!</h2>
                <p>Dear ${booking.guest.firstName},</p>
                <p>Your booking has been confirmed for:</p>
                <div style="background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px;">
                  <h3>${booking.property.title}</h3>
                  <p><strong>Address:</strong> ${booking.property.address}</p>
                  <p><strong>Check-in:</strong> ${booking.checkInDate.toDateString()}</p>
                  <p><strong>Check-out:</strong> ${booking.checkOutDate.toDateString()}</p>
                  <p><strong>Total Amount:</strong> ₦${booking.totalAmount.toLocaleString()}</p>
                  <p><strong>Payment Reference:</strong> ${reference}</p>
                </div>
                <p>Your receipt is attached to this email.</p>
                <p>Thank you for choosing Lamdon App!</p>
                <hr>
                <p style="color: #666; font-size: 12px;">Lamdon App Team</p>
              </div>
            `,
            attachments: [{
              filename: 'booking_receipt.pdf',
              path: receiptPath
            }]
          });

        } catch (pdfError) {
          console.error('PDF generation error:', pdfError);
        }
      }
    }

    res.json({
      success: true,
      data: {
        ...transaction,
        amount: transaction.amount / 100 // Convert back to naira
      },
      message: transaction.status === 'success' ? 'Payment verified successfully' : 'Payment verification failed'
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

// Withdraw funds
export const withdrawFunds = async (req: Request, res: Response) => {
  try {
    const { amount, accountNumber, bankCode, accountName } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!amount || !accountNumber || !bankCode || !accountName) {
      return res.status(400).json({
        success: false,
        message: 'Amount, account number, bank code, and account name are required'
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has sufficient balance
    if (user.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Create transfer recipient
    const recipientResponse = await axios.post(
      'https://api.paystack.co/transferrecipient',
      {
        type: 'nuban',
        name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN'
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const recipientCode = recipientResponse.data.data.recipient_code;

    // Initiate transfer
    const transferResponse = await axios.post(
      'https://api.paystack.co/transfer',
      {
        source: 'balance',
        amount: Math.round(amount * 100), // Convert to kobo
        recipient: recipientCode,
        reason: `Withdrawal from Lamdon wallet - User: ${user.firstName} ${user.lastName}`,
        currency: 'NGN'
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Update user balance
    user.balance -= amount;
    await user.save();

    // Create transaction record
    const transaction = await new Transaction({
      user: userId,
      type: 'withdraw',
      amount: amount,
      status: 'success',
      bankDetails: {
        accountNumber,
        accountName,
        bankName: bankCode // You might want to resolve this to actual bank name
      },
      paymentMethod: 'bank_transfer',
      reference: transferResponse.data.data.transfer_code
    }).save();

    res.json({
      success: true,
      data: {
        transaction,
        transferData: transferResponse.data.data
      },
      message: 'Withdrawal initiated successfully'
    });

  } catch (err: any) {
    console.error('Withdrawal error:', err.response?.data || err.message);
    res.status(500).json({
      success: false,
      message: 'Withdrawal failed',
      error: err.response?.data?.message || err.message
    });
  }
};

export const paystackWebhook = async (req: Request, res: Response) => {
  const event = req.body;
  if (event.event === 'charge.success') {
    const reference = event.data.reference;
    // Process webhook for additional verification if needed
    console.log('Webhook received for reference:', reference);
  }
  res.sendStatus(200);
};
