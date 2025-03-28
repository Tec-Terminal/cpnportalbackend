import express from 'express';
import { registerAdmin, Login } from '../controllers/authControllers';

const router = express.Router();


// Login Route
router.post('/login', Login);
router.post('/register', registerAdmin);


export default router;