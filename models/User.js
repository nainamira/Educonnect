const { db } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    /**
     * Create a new user (Registration)
     */
    static async create(userData) {
        const { email, password, full_name, role } = userData;
        
        // Hash password before saving to MySQL
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        const [result] = await db.execute(
            `INSERT INTO users (full_name, email, password, role) 
             VALUES (?, ?, ?, ?)`,
            [full_name, email, hashedPassword, role]
        );

        return {
            user_id: result.insertId, 
            email,
            full_name,
            role
        };
    }
    
    /**
     * Find user by email (Used for Login)
     */
    static async findByEmail(email) {
        const [rows] = await db.execute(
            'SELECT user_id, full_name, email, password, role FROM users WHERE email = ?',
            [email]
        );
        return rows[0]; 
    }
    
    /**
     * Find user by user_id (Used by Auth Middleware)
     */
    static async findById(id) {
        const [rows] = await db.execute(
            'SELECT user_id, full_name, email, role FROM users WHERE user_id = ?',
            [id]
        );
        return rows[0];
    }
    
    /**
     * Compare plain password with hashed password
     */
    static async comparePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
    
    static async emailExists(email) {
        const user = await this.findByEmail(email);
        return user !== undefined;
    }
    
    /**
     * Update reset token (Forgot Password flow)
     */
    static async updateResetToken(email, resetToken, expiresAt) {
        const [result] = await db.execute(
            'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
            [resetToken, expiresAt, email]
        );
        return result.affectedRows > 0;
    }
    
    /**
     * Find user by valid reset token
     */
    static async findByResetToken(token) {
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
            [token]
        );
        return rows[0];
    }
    
    /**
     * Update password (handles hashing) and clear reset tokens
     */
    static async updatePassword(userId, newPassword) {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        
        const [result] = await db.execute(
            `UPDATE users 
             SET password = ?, reset_token = NULL, reset_token_expires = NULL 
             WHERE user_id = ?`,
            [hashedPassword, userId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = User;