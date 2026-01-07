const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
    // Check if email is configured in your .env
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️ Email service skipped: SMTP credentials missing in .env');
        return null;
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com', // Default to Gmail if not set
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', 
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: {
            // Crucial for development on local machines
            rejectUnauthorized: false 
        }
    });
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetToken - The unique token from MySQL
 */
async function sendPasswordResetEmail(email, resetToken) {
    const transporter = createTransporter();
    
    if (!transporter) {
        return { success: false, message: 'Email service not configured' };
    }

    // Updated to match your likely local dev port 5000 or 5500
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    const resetUrl = `${baseUrl}/forgotpassword.html?token=${resetToken}`;
    
    const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'EduConnect Support'}" <${process.env.SMTP_USER}>`,
        to: email,
        subject: '🔒 Reset Your EduConnect Password',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 20px auto; padding: 0; border: 1px solid #eee; border-radius: 10px; overflow: hidden; }
                    .header { background-color: #007bff; color: white; padding: 30px; text-align: center; }
                    .content { background-color: #ffffff; padding: 40px; }
                    .button-wrapper { text-align: center; margin: 30px 0; }
                    .button { display: inline-block; padding: 14px 35px; background-color: #007bff; color: #ffffff !important; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; }
                    .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; background: #f9f9f9; }
                    .link-alt { font-size: 11px; color: #999; word-break: break-all; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin:0;">EduConnect</h1>
                    </div>
                    <div class="content">
                        <h2>Reset Your Password</h2>
                        <p>Hello,</p>
                        <p>We received a request to reset the password for your EduConnect account. If you didn't make this request, you can safely ignore this email.</p>
                        <div class="button-wrapper">
                            <a href="${resetUrl}" class="button">Reset My Password</a>
                        </div>
                        <p><strong>Security Note:</strong> This link will expire in <strong>1 hour</strong> for your protection.</p>
                        <hr style="border:none; border-top:1px solid #eee;">
                        <p class="link-alt">If the button above doesn't work, paste this link into your browser:<br>
                        ${resetUrl}</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2026 EduConnect. All rights reserved.</p>
                        <p>This is an automated system message.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `Reset your EduConnect password by visiting: ${resetUrl} (Link expires in 1 hour)`
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${email}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Nodemailer Error:', error.message);
        return { success: false, error: error.message };
    }
}

module.exports = { sendPasswordResetEmail };