import 'dotenv/config';
import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import Product from '../models/Product';

const CATEGORIES = [
  'Electronics',
  'Clothing',
  'Books',
  'Home & Garden',
  'Sports',
  'Toys',
  'Beauty',
  'Automotive',
];

const BRANDS: Record<string, string[]> = {
  Electronics: ['Apple', 'Samsung', 'Sony', 'LG', 'Dell', 'Bose', 'Anker', 'Logitech'],
  Clothing: ['Nike', 'Adidas', 'Zara', 'H&M', 'Levi\'s', 'Uniqlo', 'Gap', 'Ralph Lauren'],
  Books: ['Penguin', 'HarperCollins', 'Random House', 'Simon & Schuster', 'Scholastic'],
  'Home & Garden': ['IKEA', 'Dyson', 'Philips', 'Black+Decker', 'Bosch', 'KitchenAid'],
  Sports: ['Nike', 'Adidas', 'Under Armour', 'Puma', 'Wilson', 'Callaway'],
  Toys: ['LEGO', 'Hasbro', 'Mattel', 'Fisher-Price', 'Nerf', 'Hot Wheels'],
  Beauty: ['L\'Oreal', 'Maybelline', 'MAC', 'Clinique', 'Revlon', 'Estee Lauder'],
  Automotive: ['Bosch', '3M', 'Meguiar\'s', 'Michelin', 'ACDelco', 'Castrol'],
};

const TAGS: Record<string, string[]> = {
  Electronics: ['wireless', 'bluetooth', 'smart', '4K', 'HD', 'USB-C', 'fast-charging', 'portable'],
  Clothing: ['casual', 'formal', 'summer', 'winter', 'slim-fit', 'oversized', 'organic'],
  Books: ['bestseller', 'fiction', 'non-fiction', 'educational', 'self-help', 'mystery'],
  'Home & Garden': ['eco-friendly', 'energy-saving', 'smart-home', 'durable', 'compact'],
  Sports: ['lightweight', 'breathable', 'waterproof', 'professional', 'beginner'],
  Toys: ['educational', 'age-3+', 'age-6+', 'stem', 'creative', 'outdoor'],
  Beauty: ['vegan', 'cruelty-free', 'organic', 'spf', 'anti-aging', 'moisturizing'],
  Automotive: ['all-weather', 'heavy-duty', 'universal-fit', 'eco-friendly', 'professional'],
};

const UNSPLASH_TOPICS: Record<string, string> = {
  Electronics: 'technology',
  Clothing: 'fashion',
  Books: 'books',
  'Home & Garden': 'home',
  Sports: 'sports',
  Toys: 'toys',
  Beauty: 'beauty',
  Automotive: 'car',
};

const generateImageUrl = (category: string, seed: number) => {
  const topic = UNSPLASH_TOPICS[category] || 'product';
  return `https://picsum.photos/seed/${topic}-${seed}/400/400`;
};

const seedProducts = async (count = 600) => {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('✅ MongoDB connected');

  console.log('🗑  Clearing existing products...');
  await Product.deleteMany({});

  console.log(`🌱 Seeding ${count} products...`);

  const products = Array.from({ length: count }, (_, i) => {
    const category = CATEGORIES[i % CATEGORIES.length];
    const brands = BRANDS[category];
    const tags = TAGS[category];

    return {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price({ min: 5, max: 1500, dec: 2 })),
      category,
      stock: faker.number.int({ min: 0, max: 500 }),
      imageUrl: generateImageUrl(category, i + 1),
      tags: faker.helpers.arrayElements(tags, { min: 2, max: 4 }),
      rating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // 3.0 - 5.0
      numReviews: faker.number.int({ min: 0, max: 2500 }),
      brand: faker.helpers.arrayElement(brands),
      sku: `SKU-${String(i + 1).padStart(6, '0')}-${faker.string.alphanumeric(4).toUpperCase()}`,
    };
  });

  await Product.insertMany(products);
  console.log(`✅ Seeded ${count} products successfully!`);

  // Create admin user
  const User = (await import('../models/User')).default;
  const existing = await User.findOne({ email: 'admin@infotact.dev' });
  if (!existing) {
    await User.create({
      name: 'Admin',
      email: 'admin@infotact.dev',
      password: 'admin123',
      role: 'admin',
    });
    console.log('✅ Admin user created: admin@infotact.dev / admin123');
  }

  await mongoose.disconnect();
  console.log('🎉 Seeding complete!');
  process.exit(0);
};

seedProducts(600).catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
