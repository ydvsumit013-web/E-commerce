"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const signToken = (id, email, role) => jsonwebtoken_1.default.sign({ id, email, role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
});
// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ message: 'All fields are required' });
            return;
        }
        const exists = await User_1.default.findOne({ email });
        if (exists) {
            res.status(409).json({ message: 'Email already registered' });
            return;
        }
        const user = await User_1.default.create({ name, email, password });
        const token = signToken(String(user._id), user.email, user.role);
        res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error', error: String(err) });
    }
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password required' });
            return;
        }
        const user = await User_1.default.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        const token = signToken(String(user._id), user.email, user.role);
        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error', error: String(err) });
    }
});
// GET /api/auth/me
router.get('/me', auth_1.protect, async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user.id).select('-password');
        res.json(user);
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map