"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMultipleImages = exports.uploadImage = void 0;
const multer_1 = __importDefault(require("../utils/multer"));
const uploadImage = async (req, res) => {
    try {
        multer_1.default.single('image')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ message: 'Error uploading file' });
            }
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }
            res.json({ url: req.file.path });
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error uploading image' });
    }
};
exports.uploadImage = uploadImage;
const uploadMultipleImages = async (req, res) => {
    try {
        multer_1.default.array('images', 10)(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ message: 'Error uploading files' });
            }
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ message: 'No files uploaded' });
            }
            const urls = req.files.map(file => file.path);
            res.json({ urls });
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error uploading images' });
    }
};
exports.uploadMultipleImages = uploadMultipleImages;
