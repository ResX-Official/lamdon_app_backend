import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  property: mongoose.Types.ObjectId;
  guest: mongoose.Types.ObjectId;
  host: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
  totalAmount: number;
  numberOfGuests: number;
  specialRequests?: string;
  adminNotes?: string;
  cancellationReason?: string;
  checkInDate?: Date;
  checkOutDate?: Date;
  actualCheckInDate?: Date;
  actualCheckOutDate?: Date;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'partial_refund';
  paystackReference?: string;
  paymentReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>({
  property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  guest: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  host: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'], default: 'pending' },
  totalAmount: { type: Number, required: true },
  numberOfGuests: { type: Number, required: true },
  specialRequests: { type: String },
  adminNotes: { type: String },
  cancellationReason: { type: String },
  checkInDate: { type: Date },
  checkOutDate: { type: Date },
  actualCheckInDate: { type: Date },
  actualCheckOutDate: { type: Date },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded', 'partial_refund'], default: 'pending' },
  paystackReference: { type: String },
  paymentReference: { type: String },
}, {
  timestamps: true
});

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);