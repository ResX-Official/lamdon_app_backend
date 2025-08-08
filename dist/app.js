"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const propertyRoutes_1 = __importDefault(require("./routes/propertyRoutes"));
const bookingRoutes_1 = __importDefault(require("./routes/bookingRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const chatRoutes_1 = __importDefault(require("./routes/chatRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const reviewRoutes_1 = __importDefault(require("./routes/reviewRoutes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
const balanceRoutes_1 = __importDefault(require("./routes/balanceRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const profileRoutes_1 = __importDefault(require("./routes/profileRoutes"));
dotenv_1.default.config();
console.log('MONGODB_URI:', process.env.MONGODB_URI); // <--- Add this line
mongoose_1.default.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: '*', // For development. For production, use your frontend URL.
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json());
// Serve static files from uploads directory
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// --- Register routes ---
app.use('/api/auth', authRoutes_1.default);
app.use('/api/properties', propertyRoutes_1.default);
app.use('/api/bookings', bookingRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api/chat', chatRoutes_1.default);
app.use('/api/payments', paymentRoutes_1.default);
app.use('/api/reviews', reviewRoutes_1.default);
app.use('/api/upload', uploadRoutes_1.default);
app.use('/api/balance', balanceRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.use('/api/profile', profileRoutes_1.default);
// --- Start server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
