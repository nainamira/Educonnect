const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { authenticate } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Generate JWT token - UPDATED to use user_id
function generateToken(user) {
    return jwt.sign(
        { 
            user_id: user.user_id, // Match the MySQL column name
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
        
        const emailExists = await User.emailExists(email);
        if (emailExists) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }
        
        // Create user in MySQL
        const user = await User.create({ email, password, full_name, role });
        
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
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
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
        console.error('Login error:', error);
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

// @route   POST /api/auth/forgot-password
router.post('/forgot-password', [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const { email } = req.body;
        const user = await User.findByEmail(email);
        
        if (!user) {
            return res.json({ success: true, message: 'If that email exists, a password reset link has been sent.' });
        }
        
        const crypto = require('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour
        
        const tokenUpdated = await User.updateResetToken(email, resetToken, expiresAt);
        
        if (!tokenUpdated) {
            return res.json({ 
                success: true, 
                message: 'If that email exists, a password reset link has been sent.',
                resetToken: resetToken // Return token for development
            });
        }
        
        // Note: You must have an emailService.js in your utils folder for this to work
        try {
            const { sendPasswordResetEmail } = require('../utils/emailService');
            const emailResult = await sendPasswordResetEmail(email, resetToken);
            
            res.json({
                success: true,
                message: 'If that email exists, a password reset link has been sent.',
                emailSent: emailResult.success
            });
        } catch (emailError) {
            // Email service not available - return token for development
            res.json({
                success: true,
                message: 'If that email exists, a password reset link has been sent.',
                emailSent: false,
                resetToken: resetToken // Return token for development
            });
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/auth/reset-password
router.post('/reset-password', [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const { token, password } = req.body;
        const user = await User.findByResetToken(token);
        
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }
        
        await User.updatePassword(user.user_id, password);
        
        res.json({
            success: true,
            message: 'Password has been reset successfully.'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;