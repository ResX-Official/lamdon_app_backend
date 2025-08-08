import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  isConfirmed: boolean;
  confirmationCode: string;
  balance: number;
  blocked: boolean;
  isAdmin: boolean;
  userType: 'guest' | 'host' | 'admin';
  profileImage?: string;
  address?: string;
  dateOfBirth?: Date;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  verificationStatus: 'pending' | 'verified' | 'rejected';
  documents?: string[];
  bankAccountNumber?: string;
  bankCode?: string;
  paystackRecipientCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  phone:     { type: String, required: true },
  password:  { type: String, required: true },
  isConfirmed: { type: Boolean, default: false },
  confirmationCode: { type: String },
  balance: { type: Number, default: 0 },
  blocked: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  userType: { type: String, enum: ['guest', 'host', 'admin'], default: 'guest' },
  profileImage: { type: String },
  address: { type: String },
  dateOfBirth: { type: Date },
  emergencyContact: {
    name: { type: String },
    phone: { type: String },
    relationship: { type: String }
  },
  verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  documents: [{ type: String }],
  bankAccountNumber: { type: String },
  bankCode: { type: String },
  paystackRecipientCode: { type: String },
}, {
  timestamps: true
});

export const User = mongoose.model<IUser>('User', userSchema);