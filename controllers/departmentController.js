const { Op } = require('sequelize');
const Department = require('../models/department');
const User = require('../models/User');
const { generateCustomDepartmentId } = require('../helpers/generateDepartmentId'); // Adjust path if needed

const createDepartmentController = async (req, res) => {
    const { department_name, department_hod, userId } = req.body;

    if (!department_name || !department_hod || !userId) {
        return res.status(400).json({ message: 'department_name, department_hod, and userId are required' });
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(400).json({ message: 'Invalid userId. User does not exist.' });
        }

        const department_id = await generateCustomDepartmentId('DEP');
        const department = await Department.create({
            department_id,
            department_name,
            department_hod,
            userId,
        });
        res.status(201).json({
            message: 'Department created successfully',
            department,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllDepartmentsController = async (req, res) => {
    try {
        const departments = await Department.findAll({
            include: [{ model: User, attributes: ['id', 'username'] }],
            order: [['createdAt', 'DESC']],
        });
        res.json(departments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getDepartmentByIdController = async (req, res) => {
    const { department_id } = req.params;

    try {
        const department = await Department.findByPk(department_id, {
            include: [{ model: User, attributes: ['id', 'username'] }],
        });
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }
        res.json(department);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateDepartmentController = async (req, res) => {
    const { department_id } = req.params;
    const { department_name, department_hod, userId } = req.body;

    if (!department_name || !department_hod || !userId) {
        return res.status(400).json({ message: 'department_name, department_hod, and userId are required' });
    }

    try {
        const department = await Department.findByPk(department_id);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(400).json({ message: 'Invalid userId. User does not exist.' });
        }

        await department.update({ department_name, department_hod, userId });
        res.json({ message: 'Department updated successfully', department });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteDepartmentController = async (req, res) => {
    const { department_id } = req.params;

    try {
        const department = await Department.findByPk(department_id);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }
        await department.destroy();
        res.json({ message: 'Department deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createDepartmentController,
    getAllDepartmentsController,
    getDepartmentByIdController,
    updateDepartmentController,
    deleteDepartmentController,
};