import { Request, Response, NextFunction } from 'express';
import User from '../models/User';

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.session.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  try {
    const user = await User.findById(req.session.user.id);
    
    if (!user || user.status === 'INACTIVE') {
      req.session.destroy(() => {
        res.status(403).json({ 
          message: 'Your account is deactivated or deleted. Please contact Super Admin for support.',
          code: 'ACCOUNT_INACTIVE'
        });
      });
      return;
    }

    // Sync latest role and permissions to session
    req.session.user = {
      ...req.session.user!,
      role: user.role,
      permissions: user.permissions || []
    };

    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session.user || !allowedRoles.includes(req.session.user.role)) {
      res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      return;
    }
    next();
  };
};
