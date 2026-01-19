import nodemailer from 'nodemailer';

const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: parseInt(process.env.EMAIL_PORT || '587') === 465,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 30000,
        greetingTimeout: 15000,
        socketTimeout: 30000
    });
};

const verifyApiKey = (req) => {
    const apiKey = req.headers['x-api-key'];
    return apiKey === process.env.EMAIL_API_KEY;
};

export default async function handler(req, res) {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-KEY');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    return res.status(200).json({
        status: 'ok',
        service: 'velocity-email-service',
        timestamp: new Date().toISOString(),
        endpoints: [
            '/api/send-job-alert',
            '/api/send-job-application',
            '/api/send-matching-job',
            '/api/send-proposal-approval'
        ]
    });
}
