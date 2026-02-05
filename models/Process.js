const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Process = sequelize.define('Process', {
    process_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        unique: true
    },
    sheet_name: {
        type: DataTypes.STRING,
        allowNull: false, // Mandatory since each process is tied to a sheet
    },
    time_stamp_1: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    first_call_attended: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
    },
    reason_for_call: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    outcome: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    time_stamp_2: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    second_call_attended: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
    },
    reason_for_call_1: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    outcome_1: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    time_stamp_3: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    third_call_attended: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
    },
    reason_for_call_2: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    outcome_2: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    nature_of_case: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    remarks_for_specific: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    time_stamp_4: {
        type: DataTypes.DATE,
        allowNull: true,
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

User.hasMany(Process, { foreignKey: 'userId' });
Process.belongsTo(User, { foreignKey: 'userId' });

module.exports = Process;