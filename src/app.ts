import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';

import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import propertyRoutes from './routes/propertyRoutes';
import bookingRoutes from './routes/bookingRoutes';
import notificationRoutes from './routes/notificationRoutes';
import chatRoutes from './routes/chatRoutes';
import paymentRoutes from './routes/paymentRoutes';
import reviewRoutes from './routes/reviewRoutes';
import uploadRoutes from './routes/uploadRoutes';
import balanceRoutes from './routes/balanceRoutes';
import adminRoutes from './routes/adminRoutes';
import supportRoutes from './routes/supportRoutes';

dotenv.config();

// Check required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  console.error('Please check your .env file or environment configuration');
  
  // In production, try to continue with default values instead of exiting
  if (process.env.NODE_ENV === 'production') {
    console.log('🔧 Running in production mode, attempting to continue...');
    if (!process.env.JWT_SECRET) {
      console.log('⚠️ Using fallback JWT_SECRET - This should be set in production!');
      process.env.JWT_SECRET = 'fallback-secret-key-change-in-production';
    }
  } else {
    process.exit(1);
  }
}

console.log('✅ Environment variables loaded successfully');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Missing');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const app = express();

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Allow requests with no origin
    const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:8080',
    'https://lamdon-app-backend.onrender.com',
    'https://lamdonapp.vercel.app'
    ];
    // Allow all *.vercel.app subdomains
    if (/^https:\/\/lamdonapp-.*\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/balance', balanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Global error handler:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});