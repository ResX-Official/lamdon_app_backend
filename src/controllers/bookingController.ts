import { Request, Response } from 'express';
import { Booking } from '../models/booking';

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
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Error updating booking.' });
  }
};