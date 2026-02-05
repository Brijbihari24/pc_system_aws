const Sheet = require('../models/Sheet');

async function generateCustomSheetId() {
    const lastSheet = await Sheet.findOne({
        order: [['createdAt', 'DESC']],
    });

    let nextNumber = 0;
    if (lastSheet && lastSheet.sheet_id.startsWith('sh-')) {
        const number = parseInt(lastSheet.sheet_id.split('-')[1]);
        nextNumber = Math.floor(Math.random() * 10000);
    }

    return `sh-${nextNumber.toString().padStart(4, '0')}`;
}

module.exports = { generateCustomSheetId };