import mongoose, { Schema, Document } from 'mongoose';

export interface ISupportTicket extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: 'booking' | 'payment' | 'property' | 'account' | 'technical' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  messages: Array<{
    sender: mongoose.Types.ObjectId;
    senderType: 'user' | 'admin';
    message: string;
    timestamp: Date;
    attachments?: string[];
  }>;
  assignedTo?: mongoose.Types.ObjectId;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['booking', 'payment', 'property', 'account', 'technical', 'other'],
    required: true 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium' 
  },
  status: { 
    type: String, 
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open' 
  },
  messages: [{
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderType: { type: String, enum: ['user', 'admin'], required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    attachments: [{ type: String }]
  }],
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  resolutionNotes: { type: String },
  resolvedAt: { type: Date }
}, {
  timestamps: true
});

export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema);
