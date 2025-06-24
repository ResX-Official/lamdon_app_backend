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
  toilets: { type: Number, default: 1 }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

export const Property = mongoose.model<IProperty>('Property', propertySchema);