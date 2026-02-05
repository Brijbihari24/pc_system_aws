const Task = require('../models/Task');

async function generateCustomTaskId() {
    const lastTask = await Task.findOne({
        order: [['createdAt', 'DESC']],
    });

    let nextNumber = 0;
    if (lastTask && lastTask.task_id.startsWith('tk-')) {
        const number = parseInt(lastTask.task_id.split('-')[1]);
        nextNumber = Math.floor(Math.random() * 10000);
    }

    return `tk-${nextNumber.toString().padStart(4, '0')}`;
}

module.exports = { generateCustomTaskId };