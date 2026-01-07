const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', 
    database: process.env.DB_NAME || 'educonnect',
    port: 3306, 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const db = pool.promise();

async function initializeDatabase() {
    try {
        await db.getConnection();
        console.log('✅ Successfully connected to educonnect MySQL database.');

        // Check if required tables exist, if not create them based on educonnect.sql
        await db.execute(`
            CREATE TABLE IF NOT EXISTS users (
                user_id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);

        // Add reset token columns if they don't exist
        try {
            await db.execute('ALTER TABLE users ADD COLUMN reset_token VARCHAR(255)');
        } catch (error) {
            // Column already exists
        }
        
        try {
            await db.execute('ALTER TABLE users ADD COLUMN reset_token_expires DATETIME');
        } catch (error) {
            // Column already exists
        }

        await db.execute(`
            CREATE TABLE IF NOT EXISTS tutors (
                tutor_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                bio TEXT DEFAULT NULL,
                rating DECIMAL(3,2) DEFAULT 0.00,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS subjects (
                subject_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS bookings (
                booking_id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                tutor_id INT NOT NULL,
                subject_id INT NOT NULL,
                booking_date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                status ENUM('pending','confirmed','cancelled','completed') DEFAULT 'pending',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
                FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
                FOREIGN KEY (tutor_id) REFERENCES tutors(tutor_id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS tutor_subjects (
                tutor_id INT NOT NULL,
                subject_id INT NOT NULL,
                PRIMARY KEY (tutor_id, subject_id),
                FOREIGN KEY (tutor_id) REFERENCES tutors(tutor_id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS tutor_reviews (
                review_id INT AUTO_INCREMENT PRIMARY KEY,
                tutor_id INT NOT NULL,
                student_id INT NOT NULL,
                rating INT NOT NULL CHECK (rating between 1 and 5),
                comment TEXT DEFAULT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
                FOREIGN KEY (tutor_id) REFERENCES tutors(tutor_id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS availability (
                availability_id INT AUTO_INCREMENT PRIMARY KEY,
                tutor_id INT NOT NULL,
                day_of_week ENUM('Mon','Tue','Wed','Thu','Fri','Sat','Sun') NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                FOREIGN KEY (tutor_id) REFERENCES tutors(tutor_id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);

        console.log('✅ All tables checked/created successfully.');
        
    } catch (err) {
        console.error('--- DATABASE ERROR ---');
        console.error('Code:', err.code);
        console.error('Message:', err.message);
        console.error('-----------------------');
    }
}

function closeDatabase() {
    return pool.end();
}

initializeDatabase();

module.exports = { db, closeDatabase };