const sequelize = require('./config/database');
const User = require('./models/User');
const Sheet = require('./models/Sheet');
const Task = require('./models/Task');
const Process = require('./models/Process');
const Department = require('./models/department');
const Ticket = require('./models/Ticket');

async function syncDatabase() {
    try {
        // Sync models without dropping data
        await sequelize.sync({ alter: true });
        console.log('Database synced successfully');
    }
    catch (err) {
        console.error('Error syncing database:', err);
    }
    // finally {
    //     await sequelize.close();
    // }
}

syncDatabase();
module.exports = syncDatabase;