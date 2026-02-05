const express = require('express');
const router = express.Router();
const {
    createTaskController,
    getAllTasksController,
    getSingleTaskController,
    editTaskController,
    deleteTaskController,
    getAllOwnTasksController,
    getDashboardController
} = require('../controllers/taskController');
const { authMiddleware } = require('../middleware/auth');

router.get('/dashboard', authMiddleware, getDashboardController);
router.post('/', authMiddleware, createTaskController);
router.get('/get-all', authMiddleware, getAllTasksController);
router.get('/get-own', authMiddleware, getAllOwnTasksController);
router.get('/:task_id', authMiddleware, getSingleTaskController);
router.patch('/:task_id', authMiddleware, editTaskController);
router.delete('/:task_id', authMiddleware, deleteTaskController);


module.exports = router;