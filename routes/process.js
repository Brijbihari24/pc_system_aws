const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { updateProcessController, getAllProcessesController, getProcessByIdController, getDashboardProcessDataController } = require('../controllers/processController');

router.get('/process-dashboard', authMiddleware, getDashboardProcessDataController)
router.patch('/update/:process_id', authMiddleware, updateProcessController);
router.get('/all', authMiddleware, getAllProcessesController);
router.get('/:process_id', authMiddleware, getProcessByIdController);

module.exports = router;