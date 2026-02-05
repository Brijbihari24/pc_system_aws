const { Op, Sequelize } = require('sequelize');
const Task = require('../models/Task');
const User = require('../models/User');
const { generateCustomTaskId } = require('../helpers/geenrateTaskId');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const createTaskController = async (req, res) => {
    const { task_name, assigned_to, due_time, task_description, review_status, task_status, additional_comment, task_type, task_frequency } = req.body;
    const userId = req.user.id;

    if (!task_name || !assigned_to || !due_time || !review_status || !task_status || !additional_comment || !task_type || !task_frequency) {
        return res.status(400).json({ message: 'All required fields must be provided' });
    }

    try {
        // Validate creator user
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(400).json({ message: 'Invalid user ID. User does not exist.' });
        }

        // Validate assigned user by username (instead of ID)
        const assignedUser = await User.findOne({ where: { username: assigned_to } });
        if (!assignedUser) {
            return res.status(400).json({ message: 'Invalid assigned_to username. User does not exist.' });
        }

        // Generate custom task ID
        const task_id = await generateCustomTaskId();

        // Create task with assigned_to as user ID
        const task = await Task.create({
            task_id,
            task_name,
            assigned_to: assignedUser.id, // Store user ID in database
            due_time,
            task_description,
            review_status,
            task_status,
            additional_comment,
            task_type,
            task_frequency,
            userId,
        });

        // Send email to assigned user
        const mailOptions = {
            from: `"Task Manager" <${process.env.EMAIL_USER}>`,
            to: assignedUser.email,
            subject: `New Task Assigned: ${task_name}`,
            text: `Hello ${assignedUser.name || assigned_to},\n\nA new task has been assigned to you:\n- Task ID: ${task_id}\n- Name: ${task_name}\n- Description: ${task_description || 'No description provided'}\n- Due Date: ${new Date(due_time).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}\n- Type: ${task_type}\n- Frequency: ${task_frequency}\n- Additional Comment: ${additional_comment}\n\nPlease visit the Task Manager to view and update the task.\n\nRegards,\nTask Manager Team`,
            html: `
                <h3>New Task Assigned: ${task_name}</h3>
                <p>Hello ${assignedUser.name || assigned_to},</p>
                <p>A new task has been assigned to you. Here are the details:</p>
                <ul>
                    <li><strong>Task ID:</strong> ${task_id}</li>
                    <li><strong>Name:</strong> ${task_name}</li>
                    <li><strong>Description:</strong> ${task_description || 'No description provided'}</li>
                    <li><strong>Due Date:</strong> ${new Date(due_time).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</li>
                    <li><strong>Type:</strong> ${task_type}</li>
                    <li><strong>Frequency:</strong> ${task_frequency}</li>
                    <li><strong>Additional Comment:</strong> ${additional_comment}</li>
                </ul>
                <p>Please visit the <a href="http://your-app.com/tasks/${task_id}">Task Manager</a> to view and update the task.</p>
                <p>Best regards,<br>Task Manager Team</p>
            `,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Email sent successfully to ${assignedUser.email}`);
        } catch (emailError) {
            console.error('Error sending email:', emailError);
        }

        // Return success response
        res.status(201).json({
            message: 'Task created successfully',
            task: {
                task_id: task.task_id,
                task_name: task.task_name,
                assigned_to: task.assigned_to,
                due_time: task.due_time,
                task_description: task.task_description,
                review_status: task.review_status,
                task_status: task.task_status,
                additional_comment: task.additional_comment,
                task_type: task.task_type,
                task_frequency: task.task_frequency,
                userId: task.userId,
            },
        });
    } catch (err) {
        console.error('Error in createTaskController:', err);
        if (err.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ message: 'Invalid user ID or assigned_to ID. User does not exist.' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllTasksController = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Access denied: User not authenticated' });
        }
        const tasks = await Task.findAll({
            include: [{ model: User, attributes: ['username'] }],
        });
        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// const getAllOwnTasksController = async (req, res) => {
//     try {
//         if (!req.user) {
//             return res.status(401).json({ message: 'Access denied: User not authenticated' });
//         }
//         let where = {};
//         if (req.user.role === 'user') {
//             where = {
//                 [Op.or]: [
//                     { userId: req.user.id },
//                     { assigned_to: req.user.username }
//                 ]
//             };
//         } // super_admin ko koi where nahi, sabhi tasks milega
//         const tasks = await Task.findAll({
//             where,
//             include: [{ model: User, attributes: ['username'] }],
//         });
//         res.json(tasks);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: 'Server error' });
//     }
// };

const getAllOwnTasksController = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Access denied: User not authenticated' });
        }
        let where = {};
        if (req.user.role === 'user') {
            where = {
                assigned_to: req.user.id
            };
        } // super_admin ko koi where nahi, sabhi tasks milega
        const tasks = await Task.findAll({
            where,
            include: [{
                model: User,
                // attributes: ['id'],
                attributes: ['username']
            }],
            order: [['createdAt', 'DESC']],
        });
        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getSingleTaskController = async (req, res) => {
    const { task_id } = req.params;

    try {
        const task = await Task.findByPk(task_id, {
            include: [{ model: User, attributes: ['username'] }],
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // if (req.user.role !== 'super_admin' && task.userId !== req.user.id && task.assigned_to !== req.user.username) {
        //     return res.status(403).json({ message: 'Access denied' });
        // }

        res.json(task);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// const editTaskController = async (req, res) => {
//     const { task_id } = req.params;
//     const { task_name, assigned_to, due_time, task_description, review_status, task_status, additional_comment, task_type, task_frequency, final_remarks } = req.body;

//     if (!task_name || !assigned_to || !due_time || !review_status || !task_status || !additional_comment || !task_type || !task_frequency) {
//         return res.status(400).json({ message: 'All required fields must be provided' });
//     }

//     try {
//         const task = await Task.findByPk(task_id);
//         if (!task) {
//             return res.status(404).json({ message: 'Task not found' });
//         }

//         if (req.user.role !== 'super_admin' && task.userId !== req.user.id) {
//             return res.status(403).json({ message: 'Access denied' });
//         }

//         await task.update({
//             task_name,
//             assigned_to,
//             due_time,
//             task_description,
//             review_status,
//             task_status,
//             additional_comment,
//             task_type,
//             task_frequency,
//             final_remarks,
//         });
//         res.json({ message: 'Task updated successfully' });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: 'Server error' });
//     }
// };

const editTaskController = async (req, res) => {
    const { task_id } = req.params;
    const { task_name, assigned_to, due_time, task_description, review_status, task_status, additional_comment, task_type, task_frequency, final_remarks } = req.body;

    if (!task_name || !assigned_to || !due_time || !review_status || !task_status || !additional_comment || !task_type || !task_frequency) {
        return res.status(400).json({ message: 'All required fields must be provided' });
    }

    try {
        const task = await Task.findByPk(task_id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check if user is authorized to edit the task
        // if (req.user.role !== 'super_admin' || task.assigned_to !== req.user.username) {
        //     return res.status(403).json({ message: 'Access denied' });
        // }

        await task.update({
            task_name,
            assigned_to,
            due_time,
            task_description,
            review_status,
            task_status,
            additional_comment,
            task_type,
            task_frequency,
            final_remarks,
        });
        res.json({ message: 'Task updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteTaskController = async (req, res) => {
    const { task_id } = req.params;

    try {
        const task = await Task.findByPk(task_id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (req.user.role !== 'super_admin' && task.userId !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await task.destroy();
        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllUsersController = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const users = await User.findAll({
            attributes: ['id', 'username', 'email'],
        });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getDashboardController = async (req, res) => {
    try {
        console.log('Entering getDashboardController'); // Confirm entry
        console.log('User in dashboard:', req.user); // Debug user
        if (!req.user) {
            return res.status(401).json({ message: 'Access denied: User not authenticated' });
        }

        let where = {};
        if (req.user.role === 'user') {
            where = {
                [Op.or]: [
                    { userId: req.user.id },
                    { assigned_to: req.user.username }
                ]
            };
        }

        // Total tasks
        const totalTasks = await Task.count({ where });
        console.log('Total tasks:', totalTasks);

        // Due tasks (due_time > current date and task_status != 'DONE')
        const dueTasks = await Task.count({
            where: {
                ...where,
                due_time: { [Op.gt]: new Date() },
                task_status: { [Op.ne]: 'DONE' }
            }
        });
        console.log('Due tasks:', dueTasks);

        // Complete tasks (task_status = 'DONE')
        const completeTasks = await Task.count({
            where: {
                ...where,
                task_status: 'DONE'
            }
        });
        console.log('Complete tasks:', completeTasks);

        // Complete on time tasks (task_status = 'DONE' and completed before due_time)
        const completeOnTimeTasks = await Task.count({
            where: {
                ...where,
                task_status: 'DONE',
                updatedAt: { [Op.lte]: Sequelize.col('due_time') } // Assuming updatedAt reflects completion
            }
        });
        console.log('Complete on time tasks:', completeOnTimeTasks);

        // Completion percentage
        const completionPercentage = totalTasks > 0 ? Math.round((completeTasks / totalTasks) * 100) : 0;
        console.log('Completion percentage:', completionPercentage);

        // Overall ranking (simple ranking based on complete tasks count)
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
            if (userData.userId === req.user.id) {
                userRanking = index + 1;
            }
        });
        console.log('User ranking:', userRanking);

        res.json({
            totalTasks,
            dueTasks,
            completeTasks,
            completeOnTimeTasks,
            completionPercentage,
            userRanking
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};



module.exports = {
    createTaskController,
    getAllTasksController,
    getAllOwnTasksController,
    getSingleTaskController,
    editTaskController,
    deleteTaskController,
    getAllUsersController,
    getDashboardController
};