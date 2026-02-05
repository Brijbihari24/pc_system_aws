const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Task = sequelize.define('Task', {
    task_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    task_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    assigned_to: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    due_time: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    task_description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    review_status: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    task_status: {
        type: DataTypes.ENUM('DONE', 'NOT DONE'),
        allowNull: false,
        defaultValue: 'NOT DONE',
    },
    additional_comment: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    task_type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    task_frequency: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    final_remarks: {
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

User.hasMany(Task, { foreignKey: 'userId' });
Task.belongsTo(User, { foreignKey: 'userId' });

module.exports = Task;