"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const mongoose_1 = __importDefault(require("mongoose"));
const faker_1 = require("@faker-js/faker");
const Product_1 = __importDefault(require("../models/Product"));
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
const BRANDS = {
    Electronics: ['Apple', 'Samsung', 'Sony', 'LG', 'Dell', 'Bose', 'Anker', 'Logitech'],
    Clothing: ['Nike', 'Adidas', 'Zara', 'H&M', 'Levi\'s', 'Uniqlo', 'Gap', 'Ralph Lauren'],
    Books: ['Penguin', 'HarperCollins', 'Random House', 'Simon & Schuster', 'Scholastic'],
    'Home & Garden': ['IKEA', 'Dyson', 'Philips', 'Black+Decker', 'Bosch', 'KitchenAid'],
    Sports: ['Nike', 'Adidas', 'Under Armour', 'Puma', 'Wilson', 'Callaway'],
    Toys: ['LEGO', 'Hasbro', 'Mattel', 'Fisher-Price', 'Nerf', 'Hot Wheels'],
    Beauty: ['L\'Oreal', 'Maybelline', 'MAC', 'Clinique', 'Revlon', 'Estee Lauder'],
    Automotive: ['Bosch', '3M', 'Meguiar\'s', 'Michelin', 'ACDelco', 'Castrol'],
};
const TAGS = {
    Electronics: ['wireless', 'bluetooth', 'smart', '4K', 'HD', 'USB-C', 'fast-charging', 'portable'],
    Clothing: ['casual', 'formal', 'summer', 'winter', 'slim-fit', 'oversized', 'organic'],
    Books: ['bestseller', 'fiction', 'non-fiction', 'educational', 'self-help', 'mystery'],
    'Home & Garden': ['eco-friendly', 'energy-saving', 'smart-home', 'durable', 'compact'],
    Sports: ['lightweight', 'breathable', 'waterproof', 'professional', 'beginner'],
    Toys: ['educational', 'age-3+', 'age-6+', 'stem', 'creative', 'outdoor'],
    Beauty: ['vegan', 'cruelty-free', 'organic', 'spf', 'anti-aging', 'moisturizing'],
    Automotive: ['all-weather', 'heavy-duty', 'universal-fit', 'eco-friendly', 'professional'],
};
const UNSPLASH_TOPICS = {
    Electronics: 'technology',
    Clothing: 'fashion',
    Books: 'books',
    'Home & Garden': 'home',
    Sports: 'sports',
    Toys: 'toys',
    Beauty: 'beauty',
    Automotive: 'car',
};
const generateImageUrl = (category, seed) => {
    const topic = UNSPLASH_TOPICS[category] || 'product';
    return `https://picsum.photos/seed/${topic}-${seed}/400/400`;
};
const seedProducts = async (count = 600) => {
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
    console.log('🗑  Clearing existing products...');
    await Product_1.default.deleteMany({});
    console.log(`🌱 Seeding ${count} products...`);
    const products = Array.from({ length: count }, (_, i) => {
        const category = CATEGORIES[i % CATEGORIES.length];
        const brands = BRANDS[category];
        const tags = TAGS[category];
        return {
            name: faker_1.faker.commerce.productName(),
            description: faker_1.faker.commerce.productDescription(),
            price: parseFloat(faker_1.faker.commerce.price({ min: 5, max: 1500, dec: 2 })),
            category,
            stock: faker_1.faker.number.int({ min: 0, max: 500 }),
            imageUrl: generateImageUrl(category, i + 1),
            tags: faker_1.faker.helpers.arrayElements(tags, { min: 2, max: 4 }),
            rating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // 3.0 - 5.0
            numReviews: faker_1.faker.number.int({ min: 0, max: 2500 }),
            brand: faker_1.faker.helpers.arrayElement(brands),
            sku: `SKU-${String(i + 1).padStart(6, '0')}-${faker_1.faker.string.alphanumeric(4).toUpperCase()}`,
        };
    });
    await Product_1.default.insertMany(products);
    console.log(`✅ Seeded ${count} products successfully!`);
    // Create admin user
    const User = (await Promise.resolve().then(() => __importStar(require('../models/User')))).default;
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
    await mongoose_1.default.disconnect();
    console.log('🎉 Seeding complete!');
    process.exit(0);
};
seedProducts(600).catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map