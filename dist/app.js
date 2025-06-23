"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const propertyRoutes_1 = __importDefault(require("./routes/propertyRoutes"));
const bookingRoutes_1 = __importDefault(require("./routes/bookingRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const chatRoutes_1 = __importDefault(require("./routes/chatRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const reviewRoutes_1 = __importDefault(require("./routes/reviewRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// --- FIXED CORS SETUP ---
app.use((0, cors_1.default)({
    origin: true, // allow all origins for dev
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json());
// --- Register routes ---
app.use('/api/auth', authRoutes_1.default);
app.use('/api/properties', propertyRoutes_1.default);
app.use('/api/bookings', bookingRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api/chat', chatRoutes_1.default);
app.use('/api/payments', paymentRoutes_1.default);
app.use('/api/reviews', reviewRoutes_1.default);
// --- Start server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
