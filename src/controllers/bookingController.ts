import { Request, Response } from 'express';
import { Booking } from '../models/booking';
import { Notification } from '../models/notification';
import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';
import { User } from '../models/user'; // To get guest email
import { Property } from '../models/property';
import axios from 'axios';
import { Transaction } from '../models/transaction';

// Create a booking
export const createBooking = async (req: Request, res: Response) => {
  try {
    const { paystackReference, ...bookingDetails } = req.body;
    if (!paystackReference) {
      return res.status(400).json({ message: 'Payment reference is required' });
    }
    // 1. Verify payment with Paystack
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${paystackReference}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );
    if (response.data.data.status !== 'success') {
      return res.status(400).json({ message: 'Payment not successful' });
    }
    // 2. Create booking as paid/confirmed
    const booking = await Booking.create({
      ...bookingDetails,
      paymentStatus: 'paid',
      status: 'confirmed',
      paystackReference,
    });
    // 3. Credit host and record transactions
    const host = await User.findById(booking.host);
    if (host) {
      // Only credit the host with the base price (remove 2% fee)
      const basePrice = Math.round(booking.totalAmount / 1.02);
      host.balance += basePrice;
      await host.save();
      await Transaction.create({
        user: host._id,
        type: 'credit',
        amount: basePrice,
        status: 'success',
        adminNotes: `Booking payment from guest for booking ${booking._id}`
      });
      // Record 2% fee for admin/platform
      const adminFee = booking.totalAmount - basePrice;
      await Transaction.create({
        user: null, // or admin user id if available
        type: 'fee',
        amount: adminFee,
        status: 'success',
        adminNotes: `2% platform fee for booking ${booking._id}`
      });
    }
    // Record guest transaction
    await Transaction.create({
      user: booking.guest,
      type: 'debit',
      amount: booking.totalAmount,
      status: 'success',
      adminNotes: `Booking payment to host for booking ${booking._id}`
    });
    res.json({ success: true, booking });
  } catch (err: any) {
    res.status(500).json({ message: 'Error creating booking', error: err.message });
  }
};

// Get all bookings for a property (for host)
export const getBookingsForProperty = async (req: Request, res: Response) => {
  try {
    const bookings = await Booking.find({ property: req.params.propertyId })
      .populate('guest', 'firstName lastName email')
      .populate('property', 'title address images')
      .sort({ createdAt: -1 });
      
    res.json({
      success: true,
      data: bookings,
      count: bookings.length
    });
  } catch (err) {
    console.error('Error fetching property bookings:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching bookings.' 
    });
  }
};

// Get all bookings for a guest
export const getBookingsForGuest = async (req: Request, res: Response) => {
  try {
    const bookings = await Booking.find({ guest: req.params.guestId })
      .populate('property', 'title address images')
      .populate('host', 'firstName lastName email')
      .sort({ createdAt: -1 });
      
    res.json({
      success: true,
      data: bookings,
      count: bookings.length
    });
  } catch (err) {
    console.error('Error fetching guest bookings:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching bookings.' 
    });
  }
};

// Check property availability
export const checkAvailability = async (req: Request, res: Response) => {
  try {
    const { propertyId, startDate, endDate } = req.body;
    
    if (!propertyId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: propertyId, startDate, and endDate are required.'
      });
    }

    // Check for conflicting bookings
    const conflictingBookings = await Booking.find({
      property: propertyId,
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) }
        }
      ]
    });

    const isAvailable = conflictingBookings.length === 0;
    
    res.json({
      success: true,
      data: {
        available: isAvailable,
        conflictingBookings: conflictingBookings.length
      }
    });
  } catch (err) {
    console.error('Error checking availability:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error checking availability.' 
    });
  }
};

// Get booking statistics for host
export const getBookingStats = async (req: Request, res: Response) => {
  try {
    const hostId = req.params.hostId;
    
    const totalBookings = await Booking.countDocuments({ host: hostId });
    const confirmedBookings = await Booking.countDocuments({ 
      host: hostId, 
      status: 'confirmed' 
    });
    const pendingBookings = await Booking.countDocuments({ 
      host: hostId, 
      status: 'pending' 
    });
    const completedBookings = await Booking.countDocuments({ 
      host: hostId, 
      status: 'completed' 
    });
    
    const totalRevenue = await Booking.aggregate([
      { $match: { host: hostId, status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalBookings,
        confirmedBookings,
        pendingBookings,
        completedBookings,
        totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0
      }
    });
  } catch (err) {
    console.error('Error fetching booking stats:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching booking statistics.' 
    });
  }
};

// Confirm or reject a booking (for host)
export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body; // 'confirmed', 'rejected', 'cancelled', 'completed'
    const booking = await Booking.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: 'Booking not found.' 
      });
    }
    
    // Populate related data
    await booking.populate('property', 'title address images');
    await booking.populate('guest', 'firstName lastName email');
    await booking.populate('host', 'firstName lastName email');
    
    // Notify the guest about the status change
    await Notification.create({
      user: booking.guest,
      message: `Your booking was ${status}.`,
      type: 'booking_update'
    });
    
    if (status === 'confirmed') {
      await sendBookingConfirmation(booking);
    }
    
    res.json({
      success: true,
      data: booking,
      message: `Booking ${status} successfully`
    });
  } catch (err) {
    console.error('Error updating booking:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error updating booking.' 
    });
  }
};

async function sendBookingConfirmation(booking: any) {
  try {
    // Fetch guest user
    const guest = await User.findById(booking.guest);
    if (!guest) return;

    // Generate PDF
    const doc = new PDFDocument();
    let buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      const pdfData = Buffer.concat(buffers);

      // Send email with PDF attachment
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: guest.email,
        subject: 'Booking Confirmation',
        text: `Your booking for property ${booking.property.title} is confirmed!`,
        attachments: [
          {
            filename: 'booking-confirmation.pdf',
            content: pdfData,
          },
        ],
      });
    });

    doc.text('Booking Confirmation');
    doc.text(`Property: ${booking.property.title}`);
    doc.text(`Guest: ${guest.firstName} ${guest.lastName}`);
    doc.text(`Start Date: ${booking.startDate}`);
    doc.text(`End Date: ${booking.endDate}`);
    doc.text(`Status: ${booking.status}`);
    doc.text(`Total Amount: ₦${booking.totalAmount}`);
    doc.end();
  } catch (error) {
    console.error('Error sending booking confirmation:', error);
  }
}

export const payForBooking = async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const { paystackReference } = req.body;
  // 1. Verify payment with Paystack
  const response = await axios.get(
    `https://api.paystack.co/transaction/verify/${paystackReference}`,
    { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
  );
  if (response.data.data.status !== 'success') {
    return res.status(400).json({ message: 'Payment not successful' });
  }
  // 2. Mark booking as paid, credit host, record transactions
  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.paymentStatus === 'paid') return res.status(400).json({ message: 'Booking already paid' });
  booking.paymentStatus = 'paid';
  booking.status = 'confirmed';
  await booking.save();
  // Credit host
  const host = await User.findById(booking.host);
  if (host) {
    host.balance += booking.totalAmount;
    await host.save();
    await Transaction.create({
      user: host._id,
      type: 'credit',
      amount: booking.totalAmount,
      status: 'success',
      adminNotes: `Booking payment from guest for booking ${bookingId}`
    });
  }
  // Record guest transaction
  await Transaction.create({
    user: booking.guest,
    type: 'debit',
    amount: booking.totalAmount,
    status: 'success',
    adminNotes: `Booking payment to host for booking ${bookingId}`
  });
  res.json({ success: true });
};