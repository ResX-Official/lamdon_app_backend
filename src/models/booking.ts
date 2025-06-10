import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  property: mongoose.Types.ObjectId;
  guest: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'confirmed' | 'rejected';
}

const bookingSchema = new Schema<IBooking>({
  property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  guest: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'rejected'], default: 'pending' }
});

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);