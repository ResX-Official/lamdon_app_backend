import { Request, Response } from 'express';
import { Booking } from '../models/booking';
import { Notification } from '../models/notification';
import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';
import { User } from '../models/user'; // To get guest email
import { Property } from '../models/property';

// Create a booking
export const createBooking = async (req: Request, res: Response) => {
  try {
    const { 
      property, 
      startDate, 
      endDate, 
      numberOfGuests, 
      totalAmount, 
      specialRequests 
    } = req.body;
    
    // Validate required fields
    if (!property || !startDate || !endDate || !numberOfGuests || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: property, startDate, endDate, numberOfGuests, and totalAmount are required.'
      });
    }

    // Get guest from authenticated user
    const guest = req.user?.id;
    if (!guest) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Get property to find host
    const propertyDoc = await Property.findById(property);
    if (!propertyDoc) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    const booking = new Booking({ 
      property, 
      guest, 
      host: propertyDoc.host,
      startDate, 
      endDate,
      numberOfGuests,
      totalAmount,
      specialRequests,
      status: 'pending',
      paymentStatus: 'pending'
    });
    
    await booking.save();
    
    // Populate related data
    await booking.populate('property', 'title address images');
    await booking.populate('guest', 'firstName lastName email');
    await booking.populate('host', 'firstName lastName email');
    
    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully'
    });
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error creating booking.' 
    });
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