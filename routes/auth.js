const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getUsers,
    getDashboard,
    getProfileData,
    updateProfile,
    getSuperAdminDashboard,
    getSuperAdminProcessesDashboard,
    getUserProcessesDashboard,
    getSuperAdminProcessesDashboardAll,
    getSingleEmployeeProcessesDashboard
} = require('../controllers/authController');
const { authMiddleware, restrictTo } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/users', authMiddleware, restrictTo('super_admin'), getUsers);
router.get('/super-admin-dashboard', authMiddleware, restrictTo('super_admin'), getSuperAdminDashboard);
router.get('/super-admin-dashboard-process', authMiddleware, restrictTo('super_admin'), getSuperAdminProcessesDashboard);
router.get('/super-admin-dashboard-process-updated', authMiddleware, getUserProcessesDashboard);
router.get('/super-admin-processes-dashboard-all', authMiddleware, getSuperAdminProcessesDashboardAll);
router.get('/single-employee-processes-dashboard', authMiddleware, getSingleEmployeeProcessesDashboard);
router.get('/dashboard', authMiddleware, getDashboard);
router.get('/profile-data', authMiddleware, getProfileData);
router.patch('/profile', authMiddleware, updateProfile);


module.exports = router;