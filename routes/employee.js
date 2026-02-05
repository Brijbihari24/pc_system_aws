const express = require('express');
const router = express.Router();
const { addEmployeeController, getAllEmployeesController, getSingleEmployeeController, editEmployeeController, deleteEmployeeController } = require('../controllers/employeeController');
const { authMiddleware, restrictTo } = require('../middleware/auth');

// Routes
// router.post('/', authMiddleware, restrictTo('super_admin'), addEmployeeController);
router.post('/add-employee', authMiddleware, addEmployeeController);
router.get('/get-all', authMiddleware, getAllEmployeesController);
router.get('/:id', authMiddleware, getSingleEmployeeController);
router.patch('/:id', authMiddleware, editEmployeeController);
router.delete('/:id', authMiddleware, restrictTo('super_admin'), deleteEmployeeController);

module.exports = router;