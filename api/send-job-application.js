import nodemailer from 'nodemailer';
import axios from 'axios';

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
        const { recruiterEmail, recruiterName = 'Hiring Manager', jobTitle, companyName, applicantName, applicantEmail, applicantPhone, resumeUrl, message = '' } = req.body;

        if (!recruiterEmail || !jobTitle || !applicantName || !applicantEmail) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let resumeAttachment;
        if (resumeUrl) {
            try {
                const response = await axios.get(resumeUrl, { responseType: 'arraybuffer' });
                resumeAttachment = { filename: `${applicantName.replace(/\s+/g, '_')}_Resume.pdf`, content: Buffer.from(response.data), contentType: 'application/pdf' };
            } catch (e) { console.warn('Could not fetch resume:', e.message); }
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recruiterEmail,
            subject: `Job Application for ${jobTitle} - ${applicantName}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">New Job Application</h1>
            <p style="margin: 8px 0 0 0;">${jobTitle} at ${companyName}</p>
          </div>
          <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px;">
            <p>Dear ${recruiterName},</p>
            <p>You have received a new application for <strong>${jobTitle}</strong>.</p>
            <div style="background: white; padding: 12px; border-left: 4px solid #667eea; margin: 16px 0;">
              <p style="margin: 4px 0;"><strong>Name:</strong> ${applicantName}</p>
              <p style="margin: 4px 0;"><strong>Email:</strong> <a href="mailto:${applicantEmail}">${applicantEmail}</a></p>
              ${applicantPhone ? `<p style="margin: 4px 0;"><strong>Phone:</strong> ${applicantPhone}</p>` : ''}
            </div>
            ${message ? `<div style="background: white; padding: 12px; border-left: 4px solid #667eea; margin: 16px 0;"><strong>Cover Message:</strong><p>${message}</p></div>` : ''}
            <p>Resume is attached to this email.</p>
            <p>Best regards,<br>Velocity Job Platform</p>
          </div>
        </div>
      `,
            attachments: resumeAttachment ? [resumeAttachment] : []
        };

        const result = await sendEmail(mailOptions);
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
