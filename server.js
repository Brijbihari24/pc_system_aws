const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employee');
const sheetRoutes = require('./routes/sheet');
const taskRoutes = require('./routes/task');
const processRoutes = require('./routes/process');
const departmentRoutes = require('./routes/department');
const ticketRoutes = require('./routes/ticket');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/sheets', sheetRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/processes', processRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/tickets', ticketRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));