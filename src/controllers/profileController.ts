import { Request, Response } from 'express';
import { User } from '../models/user';

// Extend Request to include user from auth middleware
interface AuthRequest extends Request {
  user?: any;
}

// Get user profile
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    const user = await User.findById(userId).select('-password -confirmationCode');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error getting user profile' 
    });
  }
};

// Update user profile
export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    const updates = req.body;
    console.log('Profile update request:', { userId, updates });

    // Remove sensitive fields that shouldn't be updated via this endpoint
    const { password, confirmationCode, isConfirmed, isAdmin, userType, ...safeUpdates } = updates;

    const user = await User.findByIdAndUpdate(
      userId, 
      safeUpdates, 
      { new: true, runValidators: true }
    ).select('-password -confirmationCode');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    console.log('Profile updated successfully:', user);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating user profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 