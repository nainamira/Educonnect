require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const { db, closeDatabase } = require('./config/database');
const { authenticate, authorize } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// --- 1. Middleware ---
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname))); 

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// =================================================================
// --- 2. API Routes ---
// =================================================================

// --- AUTH ROUTES ---
app.use('/api/auth', authRoutes);

// --- ADMIN: Get Dashboard Data (Safe & Fixed) ---
app.get('/api/admin/dashboard', async (req, res) => {
    try {
        // 1. STATS: Total Revenue & Bookings
        const [stats] = await db.execute(`
            SELECT 
                COUNT(*) as total_bookings, 
                IFNULL(SUM(total_price), 0) as total_revenue 
            FROM bookings
        `);

        // 2. STATS: Active Tutors (Only those set to 'active')
        const [tutorStats] = await db.execute(`
            SELECT COUNT(*) as active_tutors FROM tutors WHERE status = 'active'
        `);

        // 3. TABLE: Recent Transactions
        const [transactions] = await db.execute(`
            SELECT booking_id, session_date as booking_date, student_name, total_price, payment_method, status 
            FROM bookings 
            ORDER BY booking_id DESC LIMIT 10
        `);

        // 4. TABLE: Students List
        const [students] = await db.execute(`
            SELECT user_id, full_name, email, created_at FROM users WHERE role = 'student'
        `);

        // 5. TABLE: Tutors List (Joined with users for names)
        const [tutors] = await db.execute(`
            SELECT t.tutor_id, u.full_name, t.status, t.created_at
            FROM tutors t
            JOIN users u ON t.user_id = u.user_id
        `);

        res.json({
            success: true,
            stats: {
                revenue: stats[0].total_revenue,
                bookings: stats[0].total_bookings,
                active_tutors: tutorStats[0].active_tutors
            },
            transactions, students, tutors
        });
    } catch (error) {
        console.error("🔥 Admin API Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- ADMIN: API to Update Tutor Status (Accept/Reject/Revoke) ---
app.post('/api/admin/update-tutor-status', async (req, res) => {
    try {
        const { tutor_id, status } = req.body;
        
        console.log(`📡 Received update for Tutor ID: ${tutor_id} to Status: ${status}`);

        // SQL Query to update the status in the database
        const [result] = await db.execute(
            'UPDATE tutors SET status = ? WHERE tutor_id = ?',
            [status, tutor_id]
        );

        if (result.affectedRows > 0) {
            res.json({ success: true, message: `Successfully updated to ${status}!` });
        } else {
            res.status(404).json({ success: false, message: "Tutor not found in database." });
        }
    } catch (error) {
        console.error("🔥 SQL Update Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- BOOKING ROUTES ---
app.post('/api/book-session', async (req, res) => {
    try {
        const { tutor_id, name, email, date, time, hours, total_price, payment_method, session_type } = req.body;

        if (!tutor_id || !name || !email || !date || !time) {
            return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
        }

        const [result] = await db.execute(
            `INSERT INTO bookings 
            (tutor_id, student_name, student_email, session_date, session_time, duration_hours, total_price, payment_method, session_type, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [tutor_id, name, email, date, time, hours || 1, total_price || 0, payment_method || 'card', session_type || 'personal']
        );

        res.json({ success: true, message: 'Booking confirmed!', bookingId: result.insertId });
    } catch (error) {
        console.error('🔥 Booking Error:', error);
        res.status(500).json({ success: false, message: 'Database error: ' + error.message });
    }
});

// --- TUTOR ROUTES ---
app.get('/api/tutors', async (req, res) => {
    try {
        const sql = `SELECT t.*, u.full_name, u.email FROM tutors t JOIN users u ON t.user_id = u.user_id`;
        const [rows] = await db.execute(sql);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/tutors', async (req, res) => {
    try {
        // SQL ini menggabungkan table 'tutors' dan 'users' 
        // Hanya mengambil tutor yang berstatus 'active'
        const sql = `
            SELECT t.tutor_id, u.full_name, t.subjects, t.hourly_rate, t.bio, t.profile_pic, t.status 
            FROM tutors t 
            JOIN users u ON t.user_id = u.user_id 
            WHERE t.status = 'active'
        `;
        const [rows] = await db.execute(sql);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("🔥 Error fetching tutors:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Tambah ini di server.js anda
app.get('/api/tutor/sessions', authenticate, authorize('tutor'), async (req, res) => {
    try {
        // Ambil sesi berdasarkan ID tutor yang sedang log masuk
        const [rows] = await db.execute(`
            SELECT booking_id, student_name, session_date as booking_date, 
                   session_time as start_time, status 
            FROM bookings 
            WHERE tutor_id = (SELECT tutor_id FROM tutors WHERE user_id = ?)
        `, [req.user.user_id]);

        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- STUDENT ROUTES ---
app.get('/api/student/bookings', authenticate, authorize('student'), async (req, res) => {
    try {
        // Ambil email dari data user yang sedang login (melalui middleware authenticate)
        const [userRows] = await db.execute('SELECT email FROM users WHERE user_id = ?', [req.user.user_id]);
        
        if (userRows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
        
        const studentEmail = userRows[0].email;
        
        // Pastikan kolum student_email wujud di table bookings
        const [rows] = await db.execute(`SELECT * FROM bookings WHERE student_email = ? ORDER BY booking_id DESC`, [studentEmail]);
        
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- MISC ---
app.get('/api/subjects', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM subjects ORDER BY name');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to load subjects' });
    }
});

// --- ADMIN: Update Tutor Status (Accept/Reject) ---
app.post('/api/admin/update-tutor-status', async (req, res) => {
    try {
        const { tutor_id, status } = req.body; // status will be 'active' or 'rejected'
        
        await db.execute(
            'UPDATE tutors SET status = ? WHERE tutor_id = ?',
            [status, tutor_id]
        );

        res.json({ success: true, message: `Tutor is now ${status}` });
    } catch (error) {
        console.error("🔥 Status Update Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// =================================================================
// --- 3. Static & Error Handling (MUST BE LAST) ---
// =================================================================

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// THE 404 HANDLER
app.use((req, res) => {
    console.log(`⚠️ 404 Error: Route ${req.path} not found.`);
    res.status(404).json({ success: false, message: 'Resource not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('🔥 Fatal Server Error:', err.stack);
    res.status(err.status || 500).json({ success: false, message: 'Internal server error' });
});

// --- 4. Server Start ---
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});

const shutdown = async (signal) => {
    console.log(`\nShutting down (${signal})...`);
    server.close(async () => {
        if(db) await closeDatabase();
        process.exit(0);
    });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));