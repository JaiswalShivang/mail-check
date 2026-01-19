import nodemailer from 'nodemailer';

const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: parseInt(process.env.EMAIL_PORT || '587') === 465,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 30000,
        greetingTimeout: 15000,
        socketTimeout: 30000
    });
};

const verifyApiKey = (req) => req.headers['x-api-key'] === process.env.EMAIL_API_KEY;

const sendEmail = async (mailOptions) => {
    const transporter = createTransporter();
    await transporter.verify();
    const info = await transporter.sendMail({ from: process.env.EMAIL_USER, ...mailOptions });
    return { success: true, messageId: info.messageId };
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-KEY');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!verifyApiKey(req)) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const mailOptions = {
            from: `"Velocity Fellowships" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verify Your Fellowship Account',
            html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #ffffff;">
          <h2 style="color: #10b981; text-align: center; margin-bottom: 24px;">Velocity Fellowships</h2>
          <p style="color: #374151; font-size: 16px;">Hello,</p>
          <p style="color: #374151; font-size: 16px;">Use the following code to verify your account:</p>
          
          <div style="background: #f3f4f6; padding: 24px; text-align: center; border-radius: 12px; margin: 24px 0; border: 1px solid #e5e7eb;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1f2937; font-family: monospace;">${code}</span>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; text-align: center;">This code expires in 10 minutes.</p>
          <div style="border-top: 1px solid #e5e7eb; margin-top: 24px; padding-top: 16px;">
             <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">If you didn't request this, please ignore this email.</p>
          </div>
        </div>
      `,
            text: `Your Velocity verification code is: ${code}\nThis code expires in 10 minutes.`
        };

        const result = await sendEmail(mailOptions);
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
