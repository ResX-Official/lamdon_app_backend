"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBookingStatus = exports.getBookingsForGuest = exports.getBookingsForProperty = exports.createBooking = void 0;
const booking_1 = require("../models/booking");
const notification_1 = require("../models/notification");
const pdfkit_1 = __importDefault(require("pdfkit"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const user_1 = require("../models/user"); // To get guest email
// Create a booking
const createBooking = async (req, res) => {
    try {
        const { property, guest, startDate, endDate } = req.body;
        const booking = new booking_1.Booking({ property, guest, startDate, endDate });
        await booking.save();
        res.status(201).json(booking);
    }
    catch (err) {
        res.status(500).json({ message: 'Error creating booking.' });
    }
};
exports.createBooking = createBooking;
// Get all bookings for a property (for host)
const getBookingsForProperty = async (req, res) => {
    try {
        const bookings = await booking_1.Booking.find({ property: req.params.propertyId }).populate('guest', 'firstName lastName email');
        res.json(bookings);
    }
    catch (err) {
        res.status(500).json({ message: 'Error fetching bookings.' });
    }
};
exports.getBookingsForProperty = getBookingsForProperty;
// Get all bookings for a guest
const getBookingsForGuest = async (req, res) => {
    try {
        const bookings = await booking_1.Booking.find({ guest: req.params.guestId }).populate('property');
        res.json(bookings);
    }
    catch (err) {
        res.status(500).json({ message: 'Error fetching bookings.' });
    }
};
exports.getBookingsForGuest = getBookingsForGuest;
// Confirm or reject a booking (for host)
const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body; // 'confirmed' or 'rejected'
        const booking = await booking_1.Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!booking)
            return res.status(404).json({ message: 'Booking not found.' });
        // Notify the guest about the status change
        await notification_1.Notification.create({
            user: booking.guest,
            message: `Your booking was ${status}.`
        });
        if (status === 'confirmed') {
            await sendBookingConfirmation(booking);
        }
        res.json(booking);
    }
    catch (err) {
        res.status(500).json({ message: 'Error updating booking.' });
    }
};
exports.updateBookingStatus = updateBookingStatus;
async function sendBookingConfirmation(booking) {
    // Fetch guest user
    const guest = await user_1.User.findById(booking.guest);
    if (!guest)
        return;
    // Generate PDF
    const doc = new pdfkit_1.default();
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
        const pdfData = Buffer.concat(buffers);
        // Send email with PDF attachment
        const transporter = nodemailer_1.default.createTransport({
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
