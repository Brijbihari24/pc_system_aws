const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
    createDepartmentController,
    getAllDepartmentsController,
    getDepartmentByIdController,
    updateDepartmentController,
    deleteDepartmentController,
} = require('../controllers/departmentController');

router.post('/', authMiddleware, createDepartmentController);
router.get('/get-all', authMiddleware, getAllDepartmentsController);
router.get('/:department_id', authMiddleware, getDepartmentByIdController);
router.patch('/:department_id', authMiddleware, updateDepartmentController);
router.delete('/:department_id', authMiddleware, deleteDepartmentController);

module.exports = router;