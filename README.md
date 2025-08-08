# Lamdon App Backend

A comprehensive property rental platform backend built with Node.js, TypeScript, Express, and MongoDB. This is the server-side application for the Lamdon property rental app.

## ✨ Features

### 🏠 Property Management
- Property listing creation, editing, and deletion
- Image upload and management
- Property approval workflow for admins
- Advanced search and filtering
- Real-time property availability

### 👥 User Management
- User registration with email verification
- Secure JWT-based authentication
- Role-based access control (Guest, Host, Admin)
- Password reset functionality
- User profile management

### 💰 Payment Integration
- Paystack payment gateway integration
- Secure booking payments
- Commission-based earnings for hosts
- Withdrawal management system
- Transaction history and receipts

### 📋 Booking System
- Property booking with date validation
- Real-time booking status updates
- Email confirmations with PDF receipts
- Booking management for hosts and guests

### 💬 Real-time Chat
- Socket.IO integration for real-time messaging
- Property-specific chat rooms
- Message history and file attachments
- Admin chat monitoring

### ⭐ Reviews & Ratings
- Property review and rating system
- Verified reviews (only after completed stays)
- Aggregate rating calculations
- Review moderation capabilities

### 🔔 Notifications
- Real-time push notifications
- Email notifications for bookings and payments
- Admin alerts for pending approvals
- Custom notification preferences

### 🎫 Support System
- Ticket-based customer support
- Priority levels and categorization
- Admin-user conversation threads
- Support ticket tracking and resolution

### 👨‍💼 Admin Panel Features
- Property approval/rejection workflow
- User management and blocking
- Chat monitoring and moderation
- Withdrawal approval system
- Comprehensive dashboard with analytics
- Support ticket management

## 🛠 Technology Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Payment**: Paystack API
- **Email**: Nodemailer with Gmail
- **File Upload**: Multer with Cloudinary
- **Real-time**: Socket.IO
- **PDF Generation**: PDFKit
- **Validation**: Custom validation middleware

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- Gmail account for email services
- Paystack account for payment processing
- Cloudinary account for image storage

## 🚀 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/ResX-Official/lamdon_app_backend.git
   cd lamdon_app_backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your actual values:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   EMAIL_USER=your_gmail_address
   EMAIL_PASS=your_gmail_app_password
   PAYSTACK_SECRET_KEY=your_paystack_secret_key
   PAYSTACK_PUBLIC_KEY=your_paystack_public_key
   FRONTEND_URL=your_frontend_url
   BACKEND_URL=your_backend_url
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with code
- `POST /api/auth/confirm-email` - Verify email address
- `POST /api/auth/resend-code` - Resend verification code

### Property Endpoints
- `GET /api/properties` - Get all approved properties (with search/filter)
- `POST /api/properties` - Create new property (Auth required)
- `GET /api/properties/:id` - Get single property
- `PUT /api/properties/:id` - Update property (Auth required)
- `DELETE /api/properties/:id` - Delete property (Auth required)
- `GET /api/properties/my-properties` - Get user's properties (Auth required)

### Booking Endpoints
- `POST /api/bookings` - Create new booking (Auth required)
- `GET /api/bookings/my-bookings` - Get user's bookings (Auth required)
- `GET /api/bookings/:id` - Get single booking (Auth required)
- `PUT /api/bookings/:id/status` - Update booking status (Auth required)

### Payment Endpoints
- `POST /api/payments/booking/initialize` - Initialize booking payment (Auth required)
- `GET /api/payments/booking/verify/:reference` - Verify payment
- `POST /api/payments/withdraw` - Withdraw funds (Auth required)
- `GET /api/payments/banks` - Get list of banks (Auth required)
- `POST /api/payments/verify-account` - Verify bank account (Auth required)

### Review Endpoints
- `GET /api/reviews/property/:propertyId` - Get property reviews
- `POST /api/reviews` - Create review (Auth required)
- `GET /api/reviews/my-reviews` - Get user's reviews (Auth required)
- `PUT /api/reviews/:id` - Update review (Auth required)
- `DELETE /api/reviews/:id` - Delete review (Auth required)

### Support Endpoints
- `POST /api/support` - Create support ticket (Auth required)
- `GET /api/support/my-tickets` - Get user's tickets (Auth required)
- `GET /api/support/:id` - Get single ticket (Auth required)
- `POST /api/support/:id/messages` - Add message to ticket (Auth required)
- `PATCH /api/support/:id/close` - Close ticket (Auth required)

### Admin Endpoints
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/properties/pending` - Get pending property approvals
- `POST /api/admin/properties/:id/approve` - Approve property
- `POST /api/admin/properties/:id/reject` - Reject property
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user details
- `POST /api/admin/users/:id/block` - Block user
- `POST /api/admin/users/:id/unblock` - Unblock user
- `GET /api/admin/bookings` - Get all bookings
- `GET /api/admin/chats` - Get all chats
- `GET /api/admin/support-tickets` - Get all support tickets

## 🏗 Project Structure

```
src/
├── controllers/         # Route handlers
│   ├── authController.ts
│   ├── propertyController.ts
│   ├── bookingController.ts
│   ├── paymentController.ts
│   ├── reviewController.ts
│   ├── supportController.ts
│   └── adminController.ts
├── models/             # MongoDB schemas
│   ├── user.ts
│   ├── property.ts
│   ├── booking.ts
│   ├── review.ts
│   ├── transaction.ts
│   ├── notification.ts
│   ├── chatMessage.ts
│   └── supportTicket.ts
├── routes/             # API routes
│   ├── authRoutes.ts
│   ├── propertyRoutes.ts
│   ├── bookingRoutes.ts
│   ├── paymentRoutes.ts
│   ├── reviewRoutes.ts
│   ├── supportRoutes.ts
│   └── adminRoutes.ts
├── middleware/         # Custom middleware
│   ├── auth.ts
│   └── adminAuth.ts
├── utils/              # Utility functions
│   ├── jwt.ts
│   └── pdfGenerator.ts
└── app.ts              # Main application file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| MONGODB_URI | MongoDB connection string | ✅ |
| JWT_SECRET | Secret key for JWT tokens | ✅ |
| EMAIL_USER | Gmail address for sending emails | ✅ |
| EMAIL_PASS | Gmail app password | ✅ |
| PAYSTACK_SECRET_KEY | Paystack secret key | ✅ |
| PAYSTACK_PUBLIC_KEY | Paystack public key | ✅ |
| FRONTEND_URL | Frontend application URL | ✅ |
| BACKEND_URL | Backend application URL | ✅ |
| NODE_ENV | Environment (development/production) | ❌ |

## 🚀 Deployment

### Render.com Deployment

1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy using the following settings:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

### Manual Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Set production environment variables**

3. **Start the production server**
   ```bash
   npm start
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support, email support@lamdon.app or create an issue in this repository.

## 🔄 Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added search functionality and forgot password
- **v1.2.0** - Enhanced payment system and reviews
- **v1.3.0** - Added support system and admin improvements

---

**Built with ❤️ by the ResX Team**
