const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        dialect: process.env.DB_DIALECT,
        logging: false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    },
);

async function connectDB() {
    try {
        await sequelize.authenticate();
        console.log("Database Connection Successfully");
    } catch (error) {
        console.log("Database Connection Error-> ", error);

    }
}

connectDB();
// sequelize.authenticate()
//     .then(() => console.log('Database connected successfully'))
//     .catch((err) => console.error('Database connection error:', err));

module.exports = sequelize;