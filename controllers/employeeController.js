const bcryptjs = require('bcryptjs');
const { Op } = require('sequelize');
const User = require('../models/User');
const { generateCustomId } = require('../helpers/generateId');

const addEmployeeController = async (req, res) => {
    const { username, email, password, role, location, designation, experience_level, department, reporting_manager, company } = req.body;

    if (!username || !email || !password || !role) {
        return res.status(400).json({ message: 'Username, email, password, and role are required' });
    }

    try {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: 'Employee with this email already exists' });
        }

        const id = await generateCustomId();
        const hashedPassword = await bcryptjs.hash(password, 10);
        const user = await User.create({
            id,
            username,
            email,
            password: hashedPassword,
            role,
            location,
            designation,
            experience_level,
            department,
            reporting_manager,
            company,
        });

        res.status(201).json({
            message: 'Employee added successfully',
            user: { id: user.id, username: user.username, email: user.email, role: user.role },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllEmployeesController = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'username', 'email', 'role', 'location', 'designation', 'experience_level', 'department', 'reporting_manager', 'company', 'working_sheet'],
            order: [['createdAt', 'DESC']],
        });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getSingleEmployeeController = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const user = await User.findByPk(id, {
            attributes: ['id', 'username', 'email', 'role', 'location', 'designation', 'experience_level', 'department', 'reporting_manager', 'company', 'password', 'working_sheet'],
        });

        if (!user) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        if (req.user.role !== 'super_admin' && userId !== id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// const editEmployeeController = async (req, res) => {
//     const { id } = req.params;
//     const userId = req.user.id;
//     const { username, email, location, designation, experience_level, department, reporting_manager, company, password, working_sheet } = req.body;

//     if (!username || !email) {
//         return res.status(400).json({ message: 'Username and email are required' });
//     }

//     try {
//         const user = await User.findByPk(id);
//         if (!user) {
//             return res.status(404).json({ message: 'Employee not found' });
//         }

//         if (req.user.role !== 'super_admin' && userId !== id) {
//             return res.status(403).json({ message: 'Access denied' });
//         }

//         const existingUser = await User.findOne({ where: { email, id: { [Op.ne]: id } } });
//         if (existingUser) {
//             return res.status(409).json({ message: 'Email already in use' });
//         }

//         await User.update(
//             { username, email, location, designation, experience_level, department, reporting_manager, company, password, working_sheet },
//             { where: { id } }
//         );
//         res.json({ message: 'Employee updated successfully' });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: 'Server error' });
//     }
// };

const editEmployeeController = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { username, email, location, designation, experience_level, department, reporting_manager, company, password, working_sheet } = req.body;

    if (!username || !email) {
        return res.status(400).json({ message: 'Username and email are required' });
    }

    try {
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        if (req.user.role !== 'super_admin' && userId !== id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const existingUser = await User.findOne({ where: { email, id: { [Op.ne]: id } } });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already in use' });
        }

        // Prepare update data
        const updateData = { username, email, location, designation, experience_level, department, reporting_manager, company, working_sheet };
        if (password) {
            // Hash the password only if a new password is provided
            const hashedPassword = await bcryptjs.hash(password, 10);
            updateData.password = hashedPassword;
        }

        await User.update(updateData, { where: { id } });
        res.json({ message: 'Employee updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteEmployeeController = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        await user.destroy();
        res.json({ message: 'Employee deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    addEmployeeController,
    getAllEmployeesController,
    getSingleEmployeeController,
    editEmployeeController,
    deleteEmployeeController,
};