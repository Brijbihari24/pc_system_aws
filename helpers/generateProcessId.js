
const { v4: uuidv4 } = require('uuid');
const Process = require('../models/Process');

async function generateCustomProcessId() {
    let isUnique = false;
    let processId = '';

    while (!isUnique) {
        const uuid = uuidv4().replace(/\D/g, ''); // e.g., '123456789012345678'
        let sixDigits = uuid.slice(0, 6);

        if (sixDigits.length < 6) {
            sixDigits = String(Math.floor(100000 + Math.random() * 900000));
        }

        processId = `pr-${sixDigits}`;

        const exists = await Process.findOne({
            where: { process_id: processId }
        });

        if (!exists) {
            isUnique = true;
        }
    }

    return processId;
}

module.exports = { generateCustomProcessId };