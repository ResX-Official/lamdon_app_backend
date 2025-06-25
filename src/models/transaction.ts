import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  user: mongoose.Types.ObjectId;
  type: 'add' | 'withdraw' | 'refund' | 'commission';
  amount: number;
  status: 'success' | 'failed' | 'pending';
  adminNotes?: string;
  rejectionReason?: string;
  bankDetails?: {
    accountNumber: string;
    accountName: string;
    bankName: string;
    routingNumber?: string;
  };
  paymentMethod?: 'bank_transfer' | 'paypal' | 'stripe' | 'other';
  reference?: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['add', 'withdraw', 'refund', 'commission'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['success', 'failed', 'pending'], default: 'pending' },
  adminNotes: { type: String },
  rejectionReason: { type: String },
  bankDetails: {
    accountNumber: { type: String },
    accountName: { type: String },
    bankName: { type: String },
    routingNumber: { type: String }
  },
  paymentMethod: { type: String, enum: ['bank_transfer', 'paypal', 'stripe', 'other'] },
  reference: { type: String }
}, {
  timestamps: true
});

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema); 