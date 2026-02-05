const { Op } = require('sequelize');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const nodemailer = require('nodemailer'); // Install: npm install nodemailer

// Configure nodemailer (example with Gmail)
// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//     },
// });


let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for 465, false for 587
    auth: {
        user: process.env.EMAIL_USER, // your email
        pass: process.env.EMAIL_PASSWORD  // your app password or real password
    }
});


const createTicketController = async (req, res) => {
    const { ticket_assigned_to_pc, due_date, ticket_issue } = req.body;

    if (!ticket_assigned_to_pc || !due_date || !ticket_issue) {
        return res.status(400).json({ message: 'All required fields must be provided' });
    }

    try {
        // Check if user is super_admin
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Access denied. Only super admin can create tickets.' });
        }

        // Find the assigned user
        const assignedUser = await User.findOne({ where: { username: ticket_assigned_to_pc } });
        if (!assignedUser) {
            return res.status(404).json({ message: 'Assigned user not found' });
        }

        // Generate custom ticket_id (example logic)
        const ticketId = `TICKET-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Create ticket
        const ticket = await Ticket.create({
            ticket_id: ticketId,
            ticket_assigned_to_pc,
            due_date,
            ticket_issue,
            ticket_status: 'OPEN',
            userId: req.user.id, // Super admin who created the ticket
        });

        // Send email to assigned person
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: assignedUser.email,
            subject: 'New Ticket Assigned',
            text: `Hello ${ticket_assigned_to_pc},\n\nA new ticket has been assigned to you:\n- Ticket ID: ${ticketId}\n- Issue: ${ticket_issue}\n- Due Date: ${due_date}\n\nPlease visit PC System to update the status and add remarks.\n\nRegards,\nSuper Admin`,
        };

        await transporter.sendMail(mailOptions);

        res.status(201).json({ message: 'Ticket created successfully', ticket });
    } catch (err) {
        console.error('Error creating ticket:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const allTicketsController = async (req, res) => {
    try {
        // Check if user is super_admin
        // if (req.user.role !== 'super_admin') {
        //     return res.status(403).json({ message: 'Access denied. Only super admin can view all tickets.' });
        // }

        // Fetch all tickets
        const tickets = await Ticket.findAll({
            attributes: [
                'ticket_id',
                'ticket_assigned_to_pc',
                'due_date',
                'ticket_status',
                'ticket_issue',
                'actual_completion_date',
                'remarks',
                'createdAt',
                'updatedAt',
            ],
            include: [{
                model: require('../models/User'),
                as: 'User', // Ensure this matches the association in Ticket model
                attributes: ['id', 'username', 'email', 'role'],
            }],
            order: [['createdAt', 'DESC']],
        });

        res.json({ message: 'Tickets fetched successfully', tickets });
    } catch (err) {
        console.error('Error fetching all tickets:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getSingleTicketController = async (req, res) => {
    const { ticket_id } = req.params;

    try {
        // Fetch the ticket with associated user data
        const ticket = await Ticket.findByPk(ticket_id, {
            attributes: [
                'ticket_id',
                'ticket_assigned_to_pc',
                'due_date',
                'ticket_status',
                'ticket_issue',
                'actual_completion_date',
                'remarks',
                'createdAt',
                'updatedAt',
            ],
            include: [{
                model: User,
                as: 'User', // Ensure this matches the association in Ticket model
                attributes: ['id', 'username', 'email', 'role'],
            }],
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Check if user is authorized
        const currentUser = req.user;
        if (
            currentUser.role !== 'super_admin' &&
            ticket.ticket_assigned_to_pc !== currentUser.username
        ) {
            return res.status(403).json({ message: 'Access denied. Only assigned person or super admin can view this ticket.' });
        }

        res.json(ticket);
    } catch (err) {
        console.error('Error fetching ticket:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateTicketController = async (req, res) => {
    const { ticket_id } = req.params;
    const { actual_completion_date, remarks } = req.body;

    try {
        const ticket = await Ticket.findByPk(ticket_id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (ticket.ticket_assigned_to_pc !== req.user.username) {
            return res.status(403).json({ message: 'Access denied. Only assigned person can update remarks.' });
        }

        await ticket.update({
            actual_completion_date,
            remarks,
            ticket_status: actual_completion_date ? 'CLOSE' : ticket.ticket_status, // Auto-close if completion date added
        });
        res.json({ message: 'Ticket updated successfully' });
    } catch (err) {
        console.error('Error updating ticket:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// module.exports = { createTicketController, updateTicketController };

module.exports = {
    createTicketController,
    allTicketsController,
    getSingleTicketController,
    updateTicketController
};