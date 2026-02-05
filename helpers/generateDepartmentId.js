const Department = require('../models/department');

async function generateCustomDepartmentId() {
    const lastDepartment = await Department.findOne({
        order: [['createdAt', 'DESC']],
    });

    let nextNumber = 0;
    if (lastDepartment && lastDepartment.department_id.startsWith('dt-')) {
        const number = parseInt(lastDepartment.department_id.split('-')[1]);
        nextNumber = Math.floor(Math.random() * 10000);
    }

    return `dt-${nextNumber.toString().padStart(4, '0')}`;
}

module.exports = { generateCustomDepartmentId };