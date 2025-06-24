import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  booking?: mongoose.Types.ObjectId;
  property?: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  message: string;
  createdAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>({
  booking: { type: Schema.Types.ObjectId, ref: 'Booking' },
  property: { type: Schema.Types.ObjectId, ref: 'Property' },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);