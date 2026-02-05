const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Adjust path to your database config
const User = require('./User');

const Department = sequelize.define('Department', {
    department_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    department_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    department_hod: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: User,
            key: 'id',
        },
    },
}, {
    timestamps: true,
});

// Define association (optional but recommended)
Department.belongsTo(User, { foreignKey: 'userId' });

module.exports = Department;