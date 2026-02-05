const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
    createSheetController,
    getAllSheetsController,
    getSheetByIdController,
    updateSheetController,
    deleteSheetController,
} = require('../controllers/sheetController');

router.post('/', authMiddleware, createSheetController);
router.get('/get-all', authMiddleware, getAllSheetsController);
router.get('/:sheet_id', authMiddleware, getSheetByIdController);
router.patch('/:sheet_id', authMiddleware, updateSheetController);
router.delete('/:sheet_id', authMiddleware, deleteSheetController);

module.exports = router;