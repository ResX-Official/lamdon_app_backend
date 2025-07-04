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
    console.log('[adminAuth] Authorization header:', req.header('Authorization'));
    if (!token) {
      console.warn('[adminAuth] No token provided');
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = verifyToken(token);
      console.log('[adminAuth] Token decoded:', decoded);
    } catch (err) {
      console.error('[adminAuth] Token verification failed:', err);
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    req.adminUser = decoded;

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password -confirmationCode');
    if (!user) {
      console.warn('[adminAuth] User not found for userId:', decoded.userId);
      return res.status(401).json({ success: false, message: 'User not found.' });
    }
    console.log('[adminAuth] User found:', user.email, 'isAdmin:', user.isAdmin, 'blocked:', user.blocked);

    // Check if user is admin
    if (!user.isAdmin) {
      console.warn('[adminAuth] User is not admin:', user.email);
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    // Check if user is blocked
    if (user.blocked) {
      console.warn('[adminAuth] User is blocked:', user.email);
      return res.status(403).json({ success: false, message: 'Access denied. Account is blocked.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[adminAuth] Error:', error);
    res.status(401).json({ success: false, message: 'Invalid token.' });
  }
}; 