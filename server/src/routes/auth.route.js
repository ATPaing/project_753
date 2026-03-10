import express from 'express';
import {
    signUp,
    login,
    getMe
} from '../controllers/auth.controller.js';

import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Sign up route
router.post('/signup', signUp);

// Login route
router.post('/login', login);

// get current user
router.get('/me', protect, getMe);

export default router;