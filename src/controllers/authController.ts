import { Request, Response } from 'express';
import { User } from '../models/user';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import nodemailer from 'nodemailer';

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    // Validate fields
    if (!firstName || !lastName || !email || !phone || !password) {
      res.status(400).json({ message: 'All fields are required.' });
      return;
    }
    if (!validator.isEmail(email)) {
      res.status(400).json({ message: 'Please enter a valid email address.' });
      return;
    }
    if (!validator.isMobilePhone(phone + '', 'any')) {
      res.status(400).json({ message: 'Please enter a valid phone number.' });
      return;
    }
    if (
      !validator.isLength(password, { min: 6 }) ||
      !/[A-Za-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      res.status(400).json({ message: 'Password must be at least 6 characters and include both letters and numbers.' });
      return;
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isConfirmed) {
      res.status(400).json({ message: 'This email is already registered.' });
      return;
    }
    if (existingUser && !existingUser.isConfirmed) {
      // Optionally, update the confirmation code and resend email here
      const confirmationCode = generateCode();
      existingUser.confirmationCode = confirmationCode;
      await existingUser.save();

      // Send confirmation email
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

      res.status(400).json({ message: 'Please confirm your email. A new code has been sent.' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const confirmationCode = generateCode();

    // Create user
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

    // Send confirmation email
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

    res.status(201).json({ message: 'Registration successful! Please check your email for the confirmation code.' });
  } catch (err: any) {
    res.status(500).json({ message: 'An error occurred during registration. Please try again.' });
  }
};

export const confirmEmail = async (req: Request, res: Response) => {
  const { email, code } = req.body;
  if (!email || !code) {
    res.status(400).json({ message: 'Email and confirmation code are required.' });
    return;
  }
  const user = await User.findOne({ email });
  if (!user) {
    res.status(400).json({ message: 'User not found.' });
    return;
  }
  if (user.isConfirmed) {
    res.status(400).json({ message: 'Email already confirmed.' });
    return;
  }
  if (user.confirmationCode !== code) {
    res.status(400).json({ message: 'Invalid confirmation code.' });
    return;
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
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: 'Invalid email or password.' });
      return;
    }
    if (!user.isConfirmed) {
      res.status(400).json({ message: 'Please confirm your email before logging in.' });
      return;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid email or password.' });
      return;
    }

    res.status(200).json({ message: 'Login successful!', user: { email: user.email, firstName: user.firstName, lastName: user.lastName } });
  } catch (err: any) {
    res.status(500).json({ message: 'An error occurred during login. Please try again.' });
  }
};