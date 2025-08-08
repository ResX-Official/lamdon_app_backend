"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdmin = exports.resendCode = exports.adminLogin = exports.login = exports.confirmEmail = exports.register = void 0;
const user_1 = require("../models/user");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const validator_1 = __importDefault(require("validator"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const jwt_1 = require("../utils/jwt");
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
const register = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password } = req.body;
        if (!firstName || !lastName || !email || !phone || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        if (!validator_1.default.isEmail(email)) {
            return res.status(400).json({ message: 'Please enter a valid email address.' });
        }
        if (!validator_1.default.isMobilePhone(phone + '', 'any')) {
            return res.status(400).json({ message: 'Please enter a valid phone number.' });
        }
        if (!validator_1.default.isLength(password, { min: 6 }) ||
            !/[A-Za-z]/.test(password) ||
            !/[0-9]/.test(password)) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters and include both letters and numbers.',
            });
        }
        const existingUser = await user_1.User.findOne({ email });
        const transporter = nodemailer_1.default.createTransport({
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
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const confirmationCode = generateCode();
        const user = new user_1.User({
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
    }
    catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ message: 'Error registering user.' });
    }
};
exports.register = register;
const confirmEmail = async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
        return res.status(400).json({ message: 'Email and confirmation code are required.' });
    }
    const user = await user_1.User.findOne({ email });
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
exports.confirmEmail = confirmEmail;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }
        const user = await user_1.User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid email or password.' });
        }
        // Type guard for IUser
        const typedUser = user;
        if (!typedUser.isConfirmed) {
            return res.status(400).json({ success: false, message: 'Please confirm your email before logging in.' });
        }
        if (typedUser.blocked) {
            return res.status(403).json({ success: false, message: 'Your account has been blocked. Please contact support.' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, typedUser.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid email or password.' });
        }
        // Generate JWT token
        const token = (0, jwt_1.generateToken)({
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
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'An error occurred during login. Please try again.' });
    }
};
exports.login = login;
// Admin login endpoint
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }
        const user = await user_1.User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid email or password.' });
        }
        // Type guard for IUser
        const typedUser = user;
        if (!typedUser.isAdmin) {
            return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
        }
        if (typedUser.blocked) {
            return res.status(403).json({ success: false, message: 'Your admin account has been blocked.' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, typedUser.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid email or password.' });
        }
        // Generate JWT token
        const token = (0, jwt_1.generateToken)({
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
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'An error occurred during admin login. Please try again.' });
    }
};
exports.adminLogin = adminLogin;
const resendCode = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }
    const user = await user_1.User.findOne({ email });
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
    const transporter = nodemailer_1.default.createTransport({
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
exports.resendCode = resendCode;
// Create admin user endpoint (for development only)
const createAdmin = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password } = req.body;
        if (!firstName || !lastName || !email || !phone || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }
        const existingUser = await user_1.User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists.' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const adminUser = new user_1.User({
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
        const adminUserTyped = adminUser;
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
    }
    catch (err) {
        console.error('Create admin error:', err);
        res.status(500).json({ success: false, message: 'Error creating admin user.' });
    }
};
exports.createAdmin = createAdmin;
