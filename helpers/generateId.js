const User = require('../models/User');

async function generateCustomId() {
    const lastUser = await User.findOne({
        order: [['createdAt', 'DESC']],
    });

    let nextNumber = 0;
    if (lastUser && lastUser.id.startsWith('em-')) {
        const number = parseInt(lastUser.id.split('-')[1]);
        nextNumber = Math.floor(Math.random() * 10000);
    }

    return `em-${nextNumber.toString().padStart(4, '0')}`;
}

module.exports = { generateCustomId };