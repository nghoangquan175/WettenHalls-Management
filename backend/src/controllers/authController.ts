import { Request, Response } from 'express';
import User from '../models/User';

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  try {
    const user = await User.findOne({ email });

    if (user?.role === 'GUEST') {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    if (user && (await user.matchPassword(password))) {
      // Check for inactive status
      if (user.status === 'INACTIVE') {
        res.status(403).json({ 
          message: 'Your account is deactivated or deleted. Please contact Super Admin for support.',
          code: 'ACCOUNT_INACTIVE'
        });
        return;
      }

      req.session.user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role as 'SUPER_ADMIN' | 'ADMIN' | 'GUEST',
      };

      res.status(200).json({
        message: 'Login successful',
        user: req.session.user,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const logoutUser = (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ 
        message: 'Could not log out. Please try again.',
        code: 'LOGOUT_FAILED'
      });
      return;
    }
    res.clearCookie('connect.sid'); // Default session cookie name
    res.status(200).json({ message: 'Logged out successfully' });
  });
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.session.user!.id);
    
    if (!user) {
      req.session.destroy(() => {
        res.status(401).json({ message: 'User no longer exists' });
      });
      return;
    }

    if (user.status === 'INACTIVE') {
      req.session.destroy(() => {
        res.status(403).json({ 
          message: 'Your account is deactivated or deleted. Please contact Super Admin for support.',
          code: 'ACCOUNT_INACTIVE'
        });
      });
      return;
    }

    res.status(200).json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
