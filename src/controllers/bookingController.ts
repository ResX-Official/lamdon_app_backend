import { Request, Response } from 'express';
import { Booking } from '../models/booking';
import { Notification } from '../models/notification';
import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';
import { User } from '../models/user'; // To get guest email

// Create a booking
export const createBooking = async (req: Request, res: Response) => {
  try {
    const { property, guest, startDate, endDate } = req.body;
    const booking = new Booking({ property, guest, startDate, endDate });
    await booking.save();
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Error creating booking.' });
  }
};

// Get all bookings for a property (for host)
export const getBookingsForProperty = async (req: Request, res: Response) => {
  try {
    const bookings = await Booking.find({ property: req.params.propertyId }).populate('guest', 'firstName lastName email');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching bookings.' });
  }
};

// Get all bookings for a guest
export const getBookingsForGuest = async (req: Request, res: Response) => {
  try {
    const bookings = await Booking.find({ guest: req.params.guestId }).populate('property');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching bookings.' });
  }
};

// Confirm or reject a booking (for host)
export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body; // 'confirmed' or 'rejected'
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    // Notify the guest about the status change
    await Notification.create({
      user: booking.guest,
      message: `Your booking was ${status}.`
    });
    if (status === 'confirmed') {
      await sendBookingConfirmation(booking);
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Error updating booking.' });
  }
};

async function sendBookingConfirmation(booking: any) {
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
      text: `Your booking for property ${booking.property} is confirmed!`,
      attachments: [
        {
          filename: 'booking-confirmation.pdf',
          content: pdfData,
        },
      ],
    });
  });

  doc.text('Booking Confirmation');
  doc.text(`Property: ${booking.property}`);
  doc.text(`Guest: ${guest.firstName} ${guest.lastName}`);
  doc.text(`Start Date: ${booking.startDate}`);
  doc.text(`End Date: ${booking.endDate}`);
  doc.text(`Status: ${booking.status}`);
  doc.end();
}