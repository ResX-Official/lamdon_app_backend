import mongoose, { Schema, Document } from 'mongoose';

export interface IProperty extends Document {
  title: string;
  description: string;
  address: string;
  price: number;
  images: string[];
  host: mongoose.Types.ObjectId;
  available: boolean;
}

const propertySchema = new Schema<IProperty>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  address: { type: String, required: true },
  price: { type: Number, required: true },
  images: [{ type: String }],
  host: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  available: { type: Boolean, default: true }
});

export const Property = mongoose.model<IProperty>('Property', propertySchema);