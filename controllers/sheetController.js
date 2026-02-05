const { Op } = require('sequelize');
const Sheet = require('../models/Sheet');
const User = require('../models/User');
const { generateCustomSheetId } = require('../helpers/generateSheetId'); // Ensure this exists

const createSheetController = async (req, res) => {
    const { sheet_name, sheet_link, department, pc_name, sheet_owner } = req.body;
    const userId = req.user?.id; // Automatically get from authenticated user via authMiddleware

    if (!sheet_name || !sheet_link || !department || !pc_name || !sheet_owner || !userId) {
        return res.status(400).json({ message: 'All fields (sheet_name, sheet_link, department, pc_name, sheet_owner, userId) are required' });
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(400).json({ message: 'Invalid userId. User does not exist.' });
        }

        const sheet_id = await generateCustomSheetId('SHT');
        const sheet = await Sheet.create({
            sheet_id,
            sheet_name,
            sheet_link,
            department,
            pc_name,
            sheet_owner,
            userId,
        });
        res.status(201).json({
            message: 'Sheet created successfully',
            sheet,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllSheetsController = async (req, res) => {
    try {
        const sheets = await Sheet.findAll({
            include: [{ model: User, as: 'User', attributes: ['id', 'username'] }],
            order: [['createdAt', 'DESC']],
        });
        res.json(sheets);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getSheetByIdController = async (req, res) => {
    const { sheet_id } = req.params;

    try {
        const sheet = await Sheet.findByPk(sheet_id, {
            include: [{ model: User, as: 'User', attributes: ['id', 'username'] }],
        });
        if (!sheet) {
            return res.status(404).json({ message: 'Sheet not found' });
        }
        res.json(sheet);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateSheetController = async (req, res) => {
    const { sheet_id } = req.params;
    const { sheet_name, sheet_link, department, pc_name, sheet_owner } = req.body;
    const userId = req.user?.id; // Automatically get from authenticated user

    if (!sheet_name || !sheet_link || !department || !pc_name || !sheet_owner || !userId) {
        return res.status(400).json({ message: 'All fields (sheet_name, sheet_link, department, pc_name, sheet_owner, userId) are required' });
    }

    try {
        const sheet = await Sheet.findByPk(sheet_id);
        if (!sheet) {
            return res.status(404).json({ message: 'Sheet not found' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(400).json({ message: 'Invalid userId. User does not exist.' });
        }

        await sheet.update({ sheet_name, sheet_link, department, pc_name, sheet_owner, userId });
        res.json({ message: 'Sheet updated successfully', sheet });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteSheetController = async (req, res) => {
    const { sheet_id } = req.params;

    try {
        const sheet = await Sheet.findByPk(sheet_id);
        if (!sheet) {
            return res.status(404).json({ message: 'Sheet not found' });
        }
        await sheet.destroy();
        res.json({ message: 'Sheet deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createSheetController,
    getAllSheetsController,
    getSheetByIdController,
    updateSheetController,
    deleteSheetController,
};