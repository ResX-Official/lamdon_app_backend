"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProperty = exports.updateProperty = exports.getProperty = exports.getProperties = exports.createProperty = void 0;
const property_1 = require("../models/property");
const createProperty = async (req, res) => {
    try {
        const { title, description, address, price, images, host } = req.body;
        const property = new property_1.Property({ title, description, address, price, images, host });
        await property.save();
        res.status(201).json(property);
    }
    catch (err) {
        res.status(500).json({ message: 'Error creating property.' });
    }
};
exports.createProperty = createProperty;
const getProperties = async (req, res) => {
    try {
        const properties = await property_1.Property.find().populate('host', 'firstName lastName email');
        res.json(properties);
    }
    catch (err) {
        res.status(500).json({ message: 'Error fetching properties.' });
    }
};
exports.getProperties = getProperties;
const getProperty = async (req, res) => {
    try {
        const property = await property_1.Property.findById(req.params.id).populate('host', 'firstName lastName email');
        if (!property)
            return res.status(404).json({ message: 'Property not found.' });
        res.json(property);
    }
    catch (err) {
        res.status(500).json({ message: 'Error' });
    }
};
exports.getProperty = getProperty;
const updateProperty = async (req, res) => {
    try {
        const property = await property_1.Property.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!property)
            return res.status(404).json({ message: 'Property not found.' });
        res.json(property);
    }
    catch (err) {
        res.status(500).json({ message: 'Error updating property.' });
    }
};
exports.updateProperty = updateProperty;
const deleteProperty = async (req, res) => {
    try {
        const property = await property_1.Property.findByIdAndDelete(req.params.id);
        if (!property)
            return res.status(404).json({ message: 'Property not found.' });
        res.json({ message: 'Property deleted.' });
    }
    catch (err) {
        res.status(500).json({ message: 'Error deleting property.' });
    }
};
exports.deleteProperty = deleteProperty;
