"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOnly = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ message: 'Not authorized, no token' });
            return;
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await User_1.default.findById(decoded.id).select('-password');
        if (!user) {
            res.status(401).json({ message: 'User not found' });
            return;
        }
        req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
        next();
    }
    catch {
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};
exports.protect = protect;
const adminOnly = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        res.status(403).json({ message: 'Admin access required' });
        return;
    }
    next();
};
exports.adminOnly = adminOnly;
//# sourceMappingURL=auth.js.map