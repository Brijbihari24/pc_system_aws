const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op, Sequelize } = require('sequelize');
const User = require('../models/User');
const Task = require('../models/Task');
const Process = require('../models/Process');
const Sheets = require('../models/Sheet');
const { generateCustomId } = require('../helpers/generateId');

const register = async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
        return res.status(400).json({ message: 'Username, email, password, and role are required' });
    }

    try {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists' });
        }

        const id = await generateCustomId();
        const hashedPassword = await bcryptjs.hash(password, 10);
        const user = await User.create({ id, username, email, password: hashedPassword, role });

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcryptjs.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getDashboard = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        res.json({
            id: user.id || '',
            username: user.username,
            email: user.email,
            role: user.role,
            location: user.location,
            designation: user.designation,
            experience_level: user.experience_level,
            department: user.department,
            reporting_manager: user.reporting_manager,
            company: user.company,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'username', 'email', 'role'],
        });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateProfile = async (req, res) => {
    const { username, email, location, designation, experience_level, department, reporting_manager, company } = req.body;
    const userId = req.user.id;

    if (!username || !email) {
        return res.status(400).json({ message: 'Username and email are required' });
    }

    try {
        const existingUser = await User.findOne({ where: { email, id: { [Op.ne]: userId } } });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already in use' });
        }

        await User.update(
            { username, email, location, designation, experience_level, department, reporting_manager, company },
            { where: { id: userId } }
        );
        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getUserProcessesDashboard = async (req, res) => {
    try {
        console.log('Entering getUserProcessesDashboard'); // Debug entry
        const userId = req.user.id; // Get user from token

        // Fetch user details
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'email', 'role'],
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch processes for the user
        const processes = await Process.findAll({
            where: { userId },
            attributes: ['process_id', 'sheet_name', 'first_call_attended', 'second_call_attended', 'third_call_attended', 'createdAt'],
        });

        // Calculate task summary (similar to Dashboard component)
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD in IST
        const todaysProcesses = processes.filter(process => {
            const processDate = new Date(process.createdAt).toISOString().split('T')[0];
            return processDate === today;
        });

        const uniqueSheets = [...new Set(todaysProcesses.map(item => item.sheet_name))].filter(sheet => sheet);
        const totalTasks = uniqueSheets.length * 3; // 3 tasks per sheet (first, second, third call)

        let completedTasks = 0;
        todaysProcesses.forEach(item => {
            if (item.first_call_attended === true) completedTasks++;
            if (item.second_call_attended === true) completedTasks++;
            if (item.third_call_attended === true) completedTasks++;
        });

        const remainingTasks = totalTasks - completedTasks;
        const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Prepare response
        const dashboardData = {
            user: user.toJSON(),
            processStats: {
                totalTasks,
                completedTasks,
                remainingTasks,
                completionPercentage,
            },
            processes: todaysProcesses, // Optional: return full process data
        };

        res.json(dashboardData);
    } catch (err) {
        console.error('User processes dashboard error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// const getSuperAdminProcessesDashboard = async (req, res) => {
//     try {
//         console.log('Entering getSuperAdminProcessesDashboard'); // Debug entry
//         const users = await User.findAll({
//             attributes: ['id', 'username', 'email', 'role'],
//             where: { role: { [Op.ne]: 'super_admin' } } // Exclude super admin
//         });

//         // Enhance user data with process metrics
//         const usersWithMetrics = await Promise.all(users.map(async (user) => {
//             const where = { userId: user.id };

//             // Fetch processes for the user
//             const processes = await Process.findAll({
//                 where,
//                 attributes: ['process_id', 'sheet_name', 'first_call_attended', 'second_call_attended', 'third_call_attended', 'createdAt'],
//             });

//             // Calculate task summary (similar to Dashboard component)
//             const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD in IST
//             const todaysProcesses = processes.filter(process => {
//                 const processDate = new Date(process.createdAt).toISOString().split('T')[0];
//                 return processDate === today;
//             });

//             const uniqueSheets = [...new Set(todaysProcesses.map(item => item.sheet_name))].filter(sheet => sheet);
//             const totalTasks = uniqueSheets.length * 3; // 3 tasks per sheet (first, second, third call)

//             let completedTasks = 0;
//             todaysProcesses.forEach(item => {
//                 if (item.first_call_attended === true) completedTasks++;
//                 if (item.second_call_attended === true) completedTasks++;
//                 if (item.third_call_attended === true) completedTasks++;
//             });

//             const remainingTasks = totalTasks - completedTasks;
//             const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

//             return {
//                 user: user.toJSON(),
//                 processStats: {
//                     totalTasks,
//                     completedTasks,
//                     remainingTasks,
//                     completionPercentage,
//                 },
//                 processes: todaysProcesses,
//             };
//         }));

//         res.json(usersWithMetrics);
//     } catch (err) {
//         console.error('Super admin processes dashboard error:', err);
//         res.status(500).json({ message: 'Server error' });
//     }
// };

const getSuperAdminProcessesDashboard = async (req, res) => {
    try {
        console.log('Entering getSuperAdminProcessesDashboard'); // Debug entry
        const users = await User.findAll({
            attributes: ['id', 'username', 'email', 'role'],
            where: { role: { [Op.ne]: 'super_admin' } } // Exclude super admin
        });

        // Enhance user data with process metrics
        const usersWithMetrics = await Promise.all(users.map(async (user) => {
            const where = { userId: user.id };

            // Fetch processes for the user
            const processes = await Process.findAll({
                where,
                attributes: ['process_id', 'sheet_name', 'first_call_attended', 'second_call_attended', 'third_call_attended', 'createdAt'],
            });

            // Calculate task summary (similar to Dashboard component)
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD in IST
            const todaysProcesses = processes.filter(process => {
                const processDate = new Date(process.createdAt).toISOString().split('T')[0];
                return processDate === today;
            });

            const uniqueSheets = [...new Set(todaysProcesses.map(item => item.sheet_name))].filter(sheet => sheet);
            const totalTasks = uniqueSheets.length * 3; // 3 tasks per sheet (first, second, third call)

            let completedTasks = 0;
            todaysProcesses.forEach(item => {
                if (item.first_call_attended === true) completedTasks++;
                if (item.second_call_attended === true) completedTasks++;
                if (item.third_call_attended === true) completedTasks++;
            });

            const remainingTasks = totalTasks - completedTasks;
            const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return {
                user: user.toJSON(),
                processStats: {
                    totalTasks,
                    completedTasks,
                    remainingTasks,
                    completionPercentage,
                },
            };
        }));

        res.json(usersWithMetrics);
    } catch (err) {
        console.error('Super admin processes dashboard error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getSuperAdminDashboard = async (req, res) => {
    try {
        console.log('Entering getSuperAdminDashboard'); // Debug entry
        const users = await User.findAll({
            attributes: ['id', 'username', 'email', 'role'],
        });

        // Enhance user data with task metrics
        const usersWithMetrics = await Promise.all(users.map(async (user) => {
            const where = {
                [Op.or]: [
                    { userId: user.id },
                    { assigned_to: user.username }
                ]
            };

            // Total tasks
            const totalTasks = await Task.count({ where });
            console.log(`Total tasks for ${user.username}:`, totalTasks);

            // Due tasks
            const dueTasks = await Task.count({
                where: {
                    ...where,
                    due_time: { [Op.gt]: new Date() },
                    task_status: { [Op.ne]: 'DONE' }
                }
            });
            console.log(`Due tasks for ${user.username}:`, dueTasks);

            // Complete tasks
            const completeTasks = await Task.count({
                where: {
                    ...where,
                    task_status: 'DONE'
                }
            });
            console.log(`Complete tasks for ${user.username}:`, completeTasks);

            // Complete on time tasks
            const completeOnTimeTasks = await Task.count({
                where: {
                    ...where,
                    task_status: 'DONE',
                    updatedAt: { [Op.lte]: Sequelize.col('due_time') }
                }
            });
            console.log(`Complete on time tasks for ${user.username}:`, completeOnTimeTasks);

            // Completion percentage
            const completionPercentage = totalTasks > 0 ? Math.round((completeTasks / totalTasks) * 100) : 0;
            console.log(`Completion percentage for ${user.username}:`, completionPercentage);

            // Overall ranking
            const allUsersTasks = await Task.findAll({
                attributes: [
                    'userId',
                    [Sequelize.fn('COUNT', Sequelize.col('task_id')), 'taskCount'],
                    [Sequelize.fn('SUM', Sequelize.literal('CASE WHEN task_status = \'DONE\' THEN 1 ELSE 0 END')), 'completedCount']
                ],
                include: [{ model: User, attributes: ['username'] }],
                group: ['userId', 'User.id'],
                order: [[Sequelize.literal('completedCount'), 'DESC']]
            });
            console.log('All users tasks data:', allUsersTasks);

            let userRanking = 0;
            allUsersTasks.forEach((userData, index) => {
                if (userData.userId === user.id) {
                    userRanking = index + 1;
                }
            });
            console.log(`User ranking for ${user.username}:`, userRanking);

            return {
                ...user.toJSON(),
                totalTasks,
                dueTasks,
                completeTasks,
                completeOnTimeTasks,
                completionPercentage,
                userRanking,
            };
        }));

        res.json(usersWithMetrics);
    } catch (err) {
        console.error('Super admin dashboard error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getSuperAdminProcessesDashboardAll = async (req, res) => {
    try {
        console.log('Entering getSuperAdminProcessesDashboardAll'); // Debug entry

        // Get date range from query params (default to all time if not provided)
        const { fromDate, toDate, filterType } = req.query;
        const now = new Date();

        let whereDate = {};
        if (fromDate && toDate) {
            whereDate = {
                createdAt: {
                    [Op.between]: [new Date(fromDate), new Date(toDate)],
                },
            };
        } else if (filterType) {
            switch (filterType.toUpperCase()) {
                case 'TODAY':
                    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
                    const endOfDay = new Date(now.setHours(23, 59, 59, 999));
                    whereDate = { createdAt: { [Op.between]: [startOfDay, endOfDay] } };
                    break;
                case 'THIS_WEEK':
                    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
                    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
                    whereDate = { createdAt: { [Op.between]: [startOfWeek, endOfWeek] } };
                    break;
                case 'LAST_WEEK':
                    const lastWeekStart = new Date(now.setDate(now.getDate() - now.getDay() - 7));
                    const lastWeekEnd = new Date(now.setDate(now.getDate() - now.getDay() - 1));
                    whereDate = { createdAt: { [Op.between]: [lastWeekStart, lastWeekEnd] } };
                    break;
                case 'THIS_MONTH':
                    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    whereDate = { createdAt: { [Op.between]: [startOfMonth, endOfMonth] } };
                    break;
                case 'LAST_MONTH':
                    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
                    whereDate = { createdAt: { [Op.between]: [lastMonthStart, lastMonthEnd] } };
                    break;
                default:
                    // No filter (all time data)
                    break;
            }
        }

        const users = await User.findAll({
            attributes: ['id', 'username', 'email', 'role'],
            where: { role: { [Op.ne]: 'super_admin' } }, // Exclude super admin
        });

        // Enhance user data with process metrics
        const usersWithMetrics = await Promise.all(users.map(async (user) => {
            const where = { userId: user.id, ...whereDate };

            // Fetch all processes for the user with date filter
            // const processes = await Process.findAll({
            //     where,
            //     attributes: ['process_id', 'sheet_name', 'first_call_attended', 'second_call_attended', 'third_call_attended', 'createdAt'],
            // });

            // const uniqueSheets = [...new Set(processes.map(item => item.sheet_name))].filter(sheet => sheet);
            // const totalTasks = uniqueSheets.length * 3; 

            const processes = await Process.findAll({
                where: { userId: user.id, ...whereDate },
                attributes: ['process_id', 'sheet_name', 'first_call_attended', 'second_call_attended', 'third_call_attended', 'createdAt'],
            });

            const totalTasks = processes.length * 3;

            let completedTasks = 0;
            processes.forEach(item => {
                if (item.first_call_attended === true) completedTasks++;
                if (item.second_call_attended === true) completedTasks++;
                if (item.third_call_attended === true) completedTasks++;
            });

            const remainingTasks = totalTasks - completedTasks;
            const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return {
                user: user.toJSON(),
                processStats: {
                    totalTasks,
                    completedTasks,
                    remainingTasks,
                    completionPercentage,
                    processes, // Return raw processes for frontend filtering
                },
            };
        }));

        res.json(usersWithMetrics);
    } catch (err) {
        console.error('Super admin processes dashboard all error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getProfileData = async (req, res) => {
    try {
        console.log('Entering getDashboardProcessDataController'); // Confirm entry
        console.log('User in dashboard process data:', req.user);
        if (!req.user) {
            return (
                res.status(401).json({ message: 'Access denied: User not authenticated' })
            )
        }
        console.log("user data ->", req.user);
        const id = req.user.id;

        const user = await User.findByPk(id, {
            attributes: { exclude: ['password'] },
            raw: true,
        });

        if (!user) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        let sheetIds = [];
        if (user.working_sheet) {
            if (Array.isArray(user.working_sheet)) {
                sheetIds = user.working_sheet;
            } else {
                try {
                    const parsed = JSON.parse(user.working_sheet);
                    if (Array.isArray(parsed)) sheetIds = parsed;
                } catch (e) {
                    if (typeof user.working_sheet === 'string') {
                        sheetIds = user.working_sheet.split(',').map(s => s.trim()).filter(Boolean);
                    }
                }
            }
        }

        let sheets = [];
        let sheet_names = [];

        if (sheetIds.length) {
            sheets = await Sheets.findAll({
                where: { sheet_id: { [Op.in]: sheetIds } },
                attributes: ['sheet_id', 'sheet_name'],
                raw: true,
            });

            sheet_names = sheets.map(s => s.sheet_name);
        }

        return res.json({
            ...user,
            sheets,
            // sheet_ids: sheetIds,
            // sheet_names,
        })
    } catch (error) {
        console.error('Profile Data error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

const getSingleEmployeeProcessesDashboard = async (req, res) => {
    try {
        console.log('Entering getEmployeeProcessesDashboard ->');
        if (!req.user) {
            return res.status(401).json({ message: 'Access denied: User not authenticated' });
        }

        const userId = req.user.id;
        const { fromDate, toDate, filterType } = req.query;
        const now = new Date();

        let whereDate = {};
        if (fromDate && toDate) {
            whereDate = {
                createdAt: {
                    [Op.between]: [new Date(fromDate), new Date(toDate)]
                }
            };
        } else if (filterType) {
            switch ((filterType || '').toUpperCase()) {
                case 'TODAY': {
                    const startOfDay = new Date();
                    startOfDay.setHours(0, 0, 0, 0);
                    const endOfDay = new Date();
                    endOfDay.setHours(23, 59, 59, 999);
                    whereDate = { createdAt: { [Op.between]: [startOfDay, endOfDay] } };
                    break;
                }
                case 'THIS_WEEK': {
                    const temp = new Date();
                    const day = temp.getDay();
                    const startOfWeek = new Date(temp);
                    startOfWeek.setDate(temp.getDate() - day);
                    startOfWeek.setHours(0, 0, 0, 0);
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);
                    endOfWeek.setHours(23, 59, 59, 999);
                    whereDate = { createdAt: { [Op.between]: [startOfWeek, endOfWeek] } };
                    break;
                }
                case 'LAST_WEEK': {
                    const temp = new Date();
                    const day = temp.getDay();
                    const startOfLastWeek = new Date(temp);
                    startOfLastWeek.setDate(temp.getDate() - day - 7);
                    startOfLastWeek.setHours(0, 0, 0, 0);
                    const endOfLastWeek = new Date(startOfLastWeek);
                    endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
                    endOfLastWeek.setHours(23, 59, 59, 999);
                    whereDate = { createdAt: { [Op.between]: [startOfLastWeek, endOfLastWeek] } };
                    break;
                }
                case 'THIS_MONTH': {
                    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    endOfMonth.setHours(23, 59, 59, 999);
                    whereDate = { createdAt: { [Op.between]: [startOfMonth, endOfMonth] } };
                    break;
                }
                case 'LAST_MONTH': {
                    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
                    lastMonthEnd.setHours(23, 59, 59, 999);
                    whereDate = { createdAt: { [Op.between]: [lastMonthStart, lastMonthEnd] } };
                    break;
                }
                default:

                    break;
            }
        }


        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] },
            raw: true,
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let sheetIds = [];
        if (user.working_sheet) {
            if (Array.isArray(user.working_sheet)) {
                sheetIds = user.working_sheet;
            } else {
                try {
                    const parsed = JSON.parse(user.working_sheet);
                    if (Array.isArray(parsed)) sheetIds = parsed;
                } catch (e) {
                    if (typeof user.working_sheet === 'string') {
                        sheetIds = user.working_sheet.split(',').map(s => s.trim()).filter(Boolean);
                    }
                }
            }
        }

        let sheets = [];
        let sheet_names = [];

        if (sheetIds.length) {
            sheets = await Sheets.findAll({
                where: { sheet_id: { [Op.in]: sheetIds } },
                attributes: ['sheet_id', 'sheet_name'],
                raw: true,
            });

            sheet_names = sheets.map(s => s.sheet_name);
        }


        const processes = await Process.findAll({
            where: { userId, ...whereDate },
            attributes: [
                'process_id',
                'sheet_name',
                'first_call_attended',
                'second_call_attended',
                'third_call_attended',
                'createdAt'
            ],
            order: [['createdAt', 'DESC']],
            raw: true,
        });


        const totalTasks = processes.length * 3;
        let completedTasks = 0;
        processes.forEach(item => {
            if (item.first_call_attended === true) completedTasks++;
            if (item.second_call_attended === true) completedTasks++;
            if (item.third_call_attended === true) completedTasks++;
        });

        const remainingTasks = Math.max(0, totalTasks - completedTasks);
        const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return res.json({
            user,
            sheets,
            processStats: {
                totalTasks,
                completedTasks,
                remainingTasks,
                completionPercentage,
                processes
            }
        });
    } catch (err) {
        console.error('Employee processes dashboard error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    register,
    login,
    getUsers,
    getDashboard,
    getProfileData,
    updateProfile,
    getSuperAdminDashboard,
    getSuperAdminProcessesDashboard,
    getUserProcessesDashboard,
    getSuperAdminProcessesDashboardAll,
    getSingleEmployeeProcessesDashboard
};