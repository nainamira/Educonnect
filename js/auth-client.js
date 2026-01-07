const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { authenticate } = require('../middleware/auth');
const { db } = require('../config/database'); // Import DB to handle tutor profile creation

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Generate JWT token
function generateToken(user) {
    return jwt.sign(
        { 
            user_id: user.user_id, 
            email: user.email, 
            role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// @route   POST /api/auth/register
router.post('/register', [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
    body('full_name').trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters long'),
    body('role').isIn(['student', 'tutor', 'admin']).withMessage('Role must be student, tutor, or admin'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) throw new Error('Passwords do not match');
        return true;
    })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        
        const { email, password, full_name, role } = req.body;
        
        // 1. Check if email exists
        const emailExists = await User.emailExists(email);
        if (emailExists) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }
        
        // 2. Create user in 'users' table
        const user = await User.create({ email, password, full_name, role });
        
        // 3. NEW: If the user is a tutor, create their initial profile in 'tutors' table
        if (role === 'tutor') {
            await db.execute(
                'INSERT INTO tutors (user_id, bio, rating, hourly_rate, subject) VALUES (?, ?, ?, ?, ?)',
                [user.user_id, 'New tutor profile', 0.0, 20.00, 'General']
            );
        }
        
        const token = generateToken(user);
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    user_id: user.user_id,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role
                },
                token
            }
        });
    } catch (error) {
        console.error('🔥 Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration. Check if MySQL is running.'
        });
    }
});

// @route   POST /api/auth/login
router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        
        const { email, password } = req.body;
        
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        
        const isPasswordValid = await User.comparePassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        
        const token = generateToken(user);
        
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    user_id: user.user_id,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role
                },
                token
            }
        });
    } catch (error) {
        console.error('🔥 Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
});

// @route   GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
    try {
        res.json({
            success: true,
            data: { user: req.user }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;