import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import propertyRoutes from './routes/propertyRoutes';
import bookingRoutes from './routes/bookingRoutes';
import notificationRoutes from './routes/notificationRoutes';
import chatRoutes from './routes/chatRoutes';
import paymentRoutes from './routes/paymentRoutes';
import reviewRoutes from './routes/reviewRoutes';
import { Server } from 'socket.io';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors({
  origin: '*', // For development. For production, set this to your frontend URL.
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);

mongoose.connect(process.env.MONGO_URI!)
  .then(() => {
    const http = require('http');
    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: '*', // Allow all origins for dev; restrict in production
        methods: ['GET', 'POST']
      }
    });

    // Socket.io logic
    io.on('connection', (socket) => {
      console.log('A user connected:', socket.id);

      socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
      });

      socket.on('sendMessage', (data) => {
        // data: { roomId, sender, message }
        io.to(data.roomId).emit('receiveMessage', data);
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error(err));