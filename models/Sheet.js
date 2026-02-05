const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Sheet = sequelize.define('Sheet', {
    sheet_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    sheet_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    sheet_link: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    department: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    pc_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    sheet_owner: {
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

// Update relationship to use userId
User.hasMany(Sheet, { foreignKey: 'userId' });
Sheet.belongsTo(User, { foreignKey: 'userId' });

module.exports = Sheet;