import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

const signToken = (id: string, email: string, role: string) =>
  jwt.sign({ id, email, role }, process.env.JWT_SECRET as string, {
    expiresIn: '7d',
  } as object);

// POST /api/auth/register
router.post('/register', async (req, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    const exists = await User.findOne({ email });
    if (exists) {
      res.status(409).json({ message: 'Email already registered' });
      return;
    }

    const user = await User.create({ name, email, password });
    const token = signToken(String(user._id), user.email, user.role);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password required' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = signToken(String(user._id), user.email, user.role);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
