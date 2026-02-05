const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Ticket = sequelize.define('Ticket', {
    ticket_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    ticket_assigned_to_pc: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    due_date: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    ticket_status: {
        type: DataTypes.ENUM('OPEN', 'CLOSE'),
        allowNull: false,
        defaultValue: 'OPEN',
    },
    ticket_issue: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    actual_completion_date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    remarks: {
        type: DataTypes.STRING,
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

User.hasMany(Ticket, { foreignKey: 'userId' });
Ticket.belongsTo(User, { foreignKey: 'userId' });

module.exports = Ticket;