import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
  tags: string[];
  rating: number;
  numReviews: number;
  brand: string;
  sku: string;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      required: true,
      enum: [
        'Electronics',
        'Clothing',
        'Books',
        'Home & Garden',
        'Sports',
        'Toys',
        'Beauty',
        'Automotive',
      ],
    },
    stock: { type: Number, required: true, default: 0 },
    imageUrl: { type: String, required: true },
    tags: [{ type: String }],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    brand: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

// Text index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });

export default mongoose.model<IProduct>('Product', productSchema);
