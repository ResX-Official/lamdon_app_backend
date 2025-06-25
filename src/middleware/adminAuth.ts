import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user';
import { verifyToken, JWTPayload } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: any;
  adminUser?: JWTPayload;
}

export const adminAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    // Verify JWT token
    const decoded = verifyToken(token);
    req.adminUser = decoded;

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password -confirmationCode');
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    // Check if user is admin
    if (!user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    // Check if user is blocked
    if (user.blocked) {
      return res.status(403).json({ success: false, message: 'Access denied. Account is blocked.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token.' });
  }
}; 