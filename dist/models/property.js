"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Property = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const propertySchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    address: { type: String, required: true },
    price: { type: Number, required: true },
    images: [{ type: String }],
    host: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    available: { type: Boolean, default: true },
    placeType: { type: String },
    placeDescription: { type: String },
    guests: { type: Number, default: 1 },
    bedrooms: { type: Number, default: 1 },
    toilets: { type: Number, default: 1 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    adminNotes: { type: String },
    rejectionReason: { type: String },
    amenities: [{ type: String }],
    houseRules: [{ type: String }],
    cancellationPolicy: { type: String, default: 'Flexible' },
    checkInTime: { type: String, default: '3:00 PM' },
    checkOutTime: { type: String, default: '11:00 AM' },
    maxGuests: { type: Number, required: true },
    propertyType: { type: String, enum: ['apartment', 'house', 'villa', 'room', 'other'], required: true },
    location: {
        latitude: { type: Number },
        longitude: { type: Number },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true },
        zipCode: { type: String }
    }
}, {
    timestamps: true
});
exports.Property = mongoose_1.default.model('Property', propertySchema);
