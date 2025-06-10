import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import propertyRoutes from './routes/propertyRoutes';
import bookingRoutes from './routes/bookingRoutes';
import notificationRoutes from './routes/notificationRoutes';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);

mongoose.connect(process.env.MONGO_URI!)
  .then(() => {
    app.listen(5000, () => {
      console.log('Server running on port 5000');
    });
  })
  .catch(err => console.error(err));