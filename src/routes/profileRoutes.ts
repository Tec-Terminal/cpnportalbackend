import express from 'express';
import {getAdminProfile, getManagerProfile, changePassword } from '../controllers/profileControllers';
import verifyToken  from '../middlewares/authMiddleware';

const router = express.Router();

// Login Route
router.get('/admin', getAdminProfile);
router.get('/manager', getManagerProfile);

// Route to change manager password
router.post('/change-password', changePassword);





export default router;