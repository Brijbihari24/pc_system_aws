const { Op } = require('sequelize');
const User = require('../models/User');
const Sheet = require('../models/Sheet');
const Process = require('../models/Process');
const { generateCustomId } = require('../helpers/generateId');
const { generateCustomProcessId } = require('../helpers/generateProcessId')
const cron = require('node-cron');
const syncDatabase = require('../sync')

const createProcessesAutomatically = async () => {
    try {
        const users = await User.findAll({ attributes: ['id', 'working_sheet'] });

        for (const user of users) {
            const workingSheets = user.working_sheet || [];
            if (!workingSheets.length) continue;

            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const existingProcesses = await Process.findAll({
                where: {
                    userId: user.id,
                    createdAt: {
                        [Op.gte]: new Date(today),
                    },
                },
            });

            const newProcesses = [];
            for (const sheetId of workingSheets) {
                const existingProcess = existingProcesses.find(p => p.sheet_id === sheetId);
                if (!existingProcess) {
                    const processId = await generateCustomProcessId();
                    const sheet = await Sheet.findByPk(sheetId);
                    const sheetName = sheet ? sheet.sheet_name : `Sheet-${sheetId}`;
                    newProcesses.push({
                        process_id: processId,
                        sheet_id: sheetId,
                        sheet_name: sheetName,
                        userId: user.id,
                        time_stamp_1: null,
                        first_call_attended: null,
                        time_stamp_2: null,
                        second_call_attended: null,
                        time_stamp_3: null,
                        third_call_attended: null,
                    });
                }
            }

            if (newProcesses.length > 0) {
                await Process.bulkCreate(newProcesses);
            }
        }
        console.log(`Processes created for ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    } catch (err) {
        console.error('Error in automatic process creation:', err);
    }
};

//only on weekdays
// cron.schedule('0 0 * * 1-5', async () => {
//     createProcessesAutomatically();
//     // syncDatabase();
//     console.log(`Job ran (Mon–Fri at 12:00 AM) - ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
// }, {
//     scheduled: true,
//     timezone: 'Asia/Kolkata',
// });

// cron.schedule('0 0 * * *', async () => {
//     createProcessesAutomatically();
//     // syncDatabase();
//     // console.log(`Database synced and processes created at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
// }, {
//     scheduled: true,
//     timezone: 'Asia/Kolkata',
// });
// createProcessesAutomatically();

// cron.schedule('0 0 * * *', async () => {
//     try {
//         await syncDatabase();
//     } catch (e) {
//         console.error("DB Sync Error in cron:", e.message);
//     }

//     try {
//         await createProcessesAutomatically();
//     } catch (e) {
//         console.error("Process Creation Error in cron:", e.message);
//     }
//     console.log(`Database synced and processes created at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
// }, {
//     scheduled: true,
//     timezone: 'Asia/Kolkata',
// });

// syncDatabase();
// createProcessesAutomatically();

const updateProcessController = async (req, res) => {
    const { process_id } = req.params;

    try {
        const process = await Process.findByPk(process_id);
        if (!process) {
            return res.status(404).json({ message: 'Process not found' });
        }

        if (req.user.id !== process.userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const calls = req.body.calls || [];
        if (!Array.isArray(calls) || calls.length === 0) {
            return res.status(400).json({ message: 'No valid calls data provided' });
        }

        for (const call of calls) {
            const { callNumber, attended, reason, outcome, timestamp } = call;

            let updateData = {};
            switch (callNumber) {
                case 1:
                    updateData = {
                        time_stamp_1: timestamp ? new Date(timestamp) : new Date(),
                        first_call_attended: attended,
                        reason_for_call: reason,
                        outcome: outcome,
                    };
                    break;
                case 2:
                    updateData = {
                        time_stamp_2: timestamp ? new Date(timestamp) : new Date(),
                        second_call_attended: attended,
                        reason_for_call_1: reason,
                        outcome_1: outcome,
                    };
                    break;
                case 3:
                    updateData = {
                        time_stamp_3: timestamp ? new Date(timestamp) : new Date(),
                        third_call_attended: attended,
                        reason_for_call_2: reason,
                        outcome_2: outcome,
                    };
                    break;
                default:
                    return res.status(400).json({ message: `Invalid call number: ${callNumber}` });
            }

            await Process.update(updateData, { where: { process_id } });
        }

        const updatedProcess = await Process.findByPk(process_id);

        res.json({
            message: 'Process updated successfully',
            process: updatedProcess,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllProcessesController = async (req, res) => {
    try {
        const userId = req.user.id;
        const processes = await Process.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
        });

        if (!processes.length) {
            return res.status(404).json({ message: 'No processes found for this user' });
        }

        res.json({ processes });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getProcessByIdController = async (req, res) => {
    try {
        const { process_id } = req.params;
        const process = await Process.findByPk(process_id);

        if (!process) {
            return res.status(404).json({ message: 'Process not found' });
        }

        if (req.user.id !== process.userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json({ process });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getDashboardProcessDataController = async (req, res) => {
    try {
        console.log('Entering getDashboardProcessDataController'); // Confirm entry
        console.log('User in dashboard process data:', req.user);

        if (!req.user) {
            return (
                res.status(401).json({ message: 'Access denied: User not authenticated' })
            )
        }

        console.log("user data ->", req.user);


        let where = {};
        if (req.user.role === 'user') {
            where = {
                [Op.or]: [
                    { userId: req.user.id }
                ]
            }
        }

        //total processes
        const totalProcesses = await Process.count({ where });
        console.log('Total Processes:', totalProcesses);

        res.json({
            totalProcesses
        })
    } catch (err) {
        console.log('Dashboard Process Data Error:', err);
        res.status(500).json({ message: 'Server error' })
    }
}

module.exports = {
    updateProcessController,
    getAllProcessesController,
    getProcessByIdController,
    getDashboardProcessDataController
};