import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  isConfirmed: boolean;
  confirmationCode: string;
}

const userSchema = new Schema<IUser>({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  phone:     { type: String, required: true },
  password:  { type: String, required: true },
  isConfirmed: { type: Boolean, default: false },
  confirmationCode: { type: String }
});

export const User = mongoose.model<IUser>('User', userSchema);