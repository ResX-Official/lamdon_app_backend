import mongoose, { Schema, Document } from 'mongoose';

export interface IProperty extends Document {
  title: string;
  description: string;
  address: string;
  price: number;
  images: string[];
  host: mongoose.Types.ObjectId;
  available: boolean;
  placeType?: string;
  placeDescription?: string;
  guests?: number;
  bedrooms?: number;
  toilets?: number;
  status: string;
  adminNotes?: string;
  rejectionReason?: string;
  amenities: string[];
  houseRules: string[];
  cancellationPolicy: string;
  checkInTime: string;
  checkOutTime: string;
  maxGuests: number;
  propertyType: 'apartment' | 'house' | 'villa' | 'room' | 'other';
  location: {
    latitude: number;
    longitude: number;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const propertySchema = new Schema<IProperty>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  address: { type: String, required: true },
  price: { type: Number, required: true },
  images: [{ type: String }],
  host: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  available: { type: Boolean, default: true },
  placeType: { type: String },
  placeDescription: { type: String },
  guests: { type: Number, default: 1 },
  bedrooms: { type: Number, default: 1 },
  toilets: { type: Number, default: 1 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNotes: { type: String },
  rejectionReason: { type: String },
  amenities: [{ type: String }],
  houseRules: [{ type: String }],
  cancellationPolicy: { type: String, default: 'Flexible' },
  checkInTime: { type: String, default: '3:00 PM' },
  checkOutTime: { type: String, default: '11:00 AM' },
  maxGuests: { type: Number, required: true },
  propertyType: { type: String, enum: ['apartment', 'house', 'villa', 'room', 'other'], required: true },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String }
  }
}, {
  timestamps: true
});

export const Property = mongoose.model<IProperty>('Property', propertySchema);