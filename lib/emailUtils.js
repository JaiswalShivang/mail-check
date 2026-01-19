import nodemailer from "nodemailer";

// Create reusable transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: parseInt(process.env.EMAIL_PORT || '587') === 465,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false
        },
        connectionTimeout: 30000,
        greetingTimeout: 15000,
        socketTimeout: 30000
    });
};

// Verify API key from request headers
export const verifyApiKey = (req) => {
    const apiKey = req.headers['x-api-key'];
    const expectedKey = process.env.EMAIL_API_KEY;

    if (!expectedKey) {
        console.error('EMAIL_API_KEY not configured in environment');
        return false;
    }

    return apiKey === expectedKey;
};

// CORS headers for API responses
export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-KEY',
};

// Send email using transporter
export const sendEmail = async (mailOptions) => {
    const transporter = createTransporter();

    // Verify configuration first
    await transporter.verify();

    const info = await transporter.sendMail({
        from: process.env.EMAIL_USER,
        ...mailOptions
    });

    return { success: true, messageId: info.messageId };
};

export default { verifyApiKey, sendEmail, corsHeaders };
