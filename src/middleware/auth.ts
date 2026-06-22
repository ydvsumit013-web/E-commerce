import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Not authorized, no token' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      email: string;
      role: string;
    };

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }
  next();
};
