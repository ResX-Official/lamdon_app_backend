import { Request, Response } from 'express';
import { User, IUser } from '../models/user';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import nodemailer from 'nodemailer';
import { generateToken } from '../utils/jwt';

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    if (!validator.isMobilePhone(phone + '', 'any')) {
      return res.status(400).json({ message: 'Please enter a valid phone number.' });
    }

    if (
      !validator.isLength(password, { min: 6 }) ||
      !/[A-Za-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters and include both letters and numbers.',
      });
    }

    const existingUser = await User.findOne({ email });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    if (existingUser && existingUser.isConfirmed) {
      return res.status(400).json({ message: 'This email is already registered.' });
    }

    if (existingUser && !existingUser.isConfirmed) {
      const confirmationCode = generateCode();
      existingUser.confirmationCode = confirmationCode;
      await existingUser.save();

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Confirmation Code',
        text: `Your confirmation code is: ${confirmationCode}`,
      });

      return res.status(400).json({
        message: 'Please confirm your email. A new code has been sent.',
        needsVerification: true,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const confirmationCode = generateCode();

    const user = new User({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      confirmationCode,
      isConfirmed: false,
    });

    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Confirmation Code',
      text: `Your confirmation code is: ${confirmationCode}`,
    });

    res.status(201).json({
      message: 'Registration successful! Please check your email for the confirmation code.',
      needsVerification: true,
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Error registering user.' });
  }
};

export const confirmEmail = async (req: Request, res: Response) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ message: 'Email and confirmation code are required.' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'User not found.' });
  }

  if (user.isConfirmed) {
    return res.status(400).json({ message: 'Email already confirmed.' });
  }

  if (user.confirmationCode !== code) {
    return res.status(400).json({ message: 'Invalid confirmation code.' });
  }

  user.isConfirmed = true;
  user.confirmationCode = '';
  await user.save();

  res.status(200).json({ message: 'Email confirmed successfully! You can now log in.' });
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password.' });
    }
    // Type guard for IUser
    const typedUser = user as IUser;

    if (!typedUser.isConfirmed) {
      return res.status(400).json({ success: false, message: 'Please confirm your email before logging in.' });
    }

    if (typedUser.blocked) {
      return res.status(403).json({ success: false, message: 'Your account has been blocked. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, typedUser.password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password.' });
    }

    // Generate JWT token
    const token = generateToken({
      userId: String(typedUser._id),
      email: typedUser.email,
      isAdmin: typedUser.isAdmin,
      userType: typedUser.userType
    });

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: String(typedUser._id),
        email: typedUser.email,
        firstName: typedUser.firstName,
        lastName: typedUser.lastName,
        isAdmin: typedUser.isAdmin,
        userType: typedUser.userType,
        balance: typedUser.balance,
        blocked: typedUser.blocked
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'An error occurred during login. Please try again.' });
  }
};

// Admin login endpoint
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password.' });
    }
    // Type guard for IUser
    const typedUser = user as IUser;

    if (!typedUser.isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    if (typedUser.blocked) {
      return res.status(403).json({ success: false, message: 'Your admin account has been blocked.' });
    }

    const isMatch = await bcrypt.compare(password, typedUser.password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password.' });
    }

    // Generate JWT token
    const token = generateToken({
      userId: String(typedUser._id),
      email: typedUser.email,
      isAdmin: typedUser.isAdmin,
      userType: typedUser.userType
    });

    res.status(200).json({
      success: true,
      message: 'Admin login successful!',
      token,
      user: {
        id: String(typedUser._id),
        email: typedUser.email,
        firstName: typedUser.firstName,
        lastName: typedUser.lastName,
        isAdmin: typedUser.isAdmin,
        userType: typedUser.userType
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'An error occurred during admin login. Please try again.' });
  }
};

export const resendCode = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'User not found.' });
  }

  if (user.isConfirmed) {
    return res.status(400).json({ message: 'Email already confirmed.' });
  }

  const confirmationCode = generateCode();
  user.confirmationCode = confirmationCode;
  await user.save();

  // Send email (same as in register)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Confirmation Code',
    text: `Your confirmation code is: ${confirmationCode}`,
  });

  res.status(200).json({ message: 'A new confirmation code has been sent to your email.' });
};

// Create admin user endpoint (for development only)
export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const adminUser = new User({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      isConfirmed: true,
      isAdmin: true,
      userType: 'admin',
      balance: 0,
      blocked: false,
      verificationStatus: 'verified'
    });

    await adminUser.save();
    const adminUserTyped = adminUser as IUser;

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: String(adminUserTyped._id),
        email: adminUserTyped.email,
        firstName: adminUserTyped.firstName,
        lastName: adminUserTyped.lastName,
        isAdmin: adminUserTyped.isAdmin
      }
    });
  } catch (err) {
    console.error('Create admin error:', err);
    res.status(500).json({ success: false, message: 'Error creating admin user.' });
  }
};
