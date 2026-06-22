"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const redisService_1 = require("./services/redisService");
const responseTime_1 = require("./middleware/responseTime");
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const products_1 = __importDefault(require("./routes/products"));
const cart_1 = __importDefault(require("./routes/cart"));
const admin_1 = __importDefault(require("./routes/admin"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// ─── Middleware ───────────────────────────────────────────────────────────────
app.use((0, cors_1.default)({ exposedHeaders: ['X-Cache', 'X-Response-Time', 'X-Cache-Invalidated'] }));
app.use(express_1.default.json());
app.use(responseTime_1.responseTime);
// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', auth_1.default);
app.use('/api/products', products_1.default);
app.use('/api/cart', cart_1.default);
app.use('/api/admin', admin_1.default);
// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ message: 'Route not found' });
});
// ─── Start ────────────────────────────────────────────────────────────────────
const start = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected');
        await (0, redisService_1.connectRedis)();
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    }
    catch (err) {
        console.error('❌ Startup error:', err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=index.js.map