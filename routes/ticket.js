const express = require('express');
const router = express.Router();
// const { authMiddleware } = require('../middleware/auth');
const { authMiddleware, restrictTo } = require('../middleware/auth');
const { createTicketController, allTicketsController, updateTicketController, getSingleTicketController } = require('../controllers/ticketController');

router.post('/ticket-add', authMiddleware, restrictTo('super_admin'), createTicketController);
router.patch('/:ticket_id', authMiddleware, updateTicketController);
router.get('/tickets/get-all', authMiddleware, allTicketsController);
router.get('/:ticket_id', authMiddleware, getSingleTicketController);

module.exports = router;