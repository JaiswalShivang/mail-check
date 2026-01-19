import { verifyApiKey, sendEmail, corsHeaders } from '../lib/emailUtils.js';
import axios from 'axios';

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).set(corsHeaders).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify API key
    if (!verifyApiKey(req)) {
        return res.status(401).json({ error: 'Unauthorized - Invalid API key' });
    }

    try {
        const {
            recruiterEmail,
            recruiterName = 'Hiring Manager',
            jobTitle,
            companyName,
            applicantName,
            applicantEmail,
            applicantPhone,
            resumeUrl,
            message = ''
        } = req.body;

        if (!recruiterEmail) {
            return res.status(400).json({ error: 'recruiterEmail is required' });
        }

        if (!jobTitle || !applicantName || !applicantEmail) {
            return res.status(400).json({ error: 'jobTitle, applicantName, and applicantEmail are required' });
        }

        console.log(`📧 Sending job application email to: ${recruiterEmail}`);

        // Fetch resume if URL provided
        let resumeAttachment;
        if (resumeUrl) {
            try {
                const response = await axios.get(resumeUrl, { responseType: 'arraybuffer' });
                resumeAttachment = {
                    filename: `${applicantName.replace(/\s+/g, '_')}_Resume.pdf`,
                    content: Buffer.from(response.data),
                    contentType: 'application/pdf'
                };
            } catch (err) {
                console.warn('Could not fetch resume:', err.message);
            }
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recruiterEmail,
            subject: `Job Application for ${jobTitle} - ${applicantName}`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-row { margin: 15px 0; padding: 10px; background: white; border-left: 4px solid #667eea; }
            .label { font-weight: bold; color: #667eea; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Job Application</h1>
              <p>${jobTitle} at ${companyName}</p>
            </div>
            <div class="content">
              <p>Dear ${recruiterName},</p>
              <p>You have received a new job application for the position of <strong>${jobTitle}</strong>.</p>
              
              <h3>Applicant Details:</h3>
              <div class="info-row">
                <span class="label">Name:</span> ${applicantName}
              </div>
              <div class="info-row">
                <span class="label">Email:</span> <a href="mailto:${applicantEmail}">${applicantEmail}</a>
              </div>
              ${applicantPhone ? `
              <div class="info-row">
                <span class="label">Phone:</span> ${applicantPhone}
              </div>
              ` : ''}
              
              ${message ? `
              <h3>Cover Message:</h3>
              <div class="info-row">
                ${message}
              </div>
              ` : ''}
              
              <p style="margin-top: 30px;">
                <strong>Resume attached:</strong> Please find the applicant's resume attached to this email.
              </p>
              
              <p>Best regards,<br>Velocity Job Platform</p>
            </div>
            <div class="footer">
              <p>This is an automated email from Velocity Job Application Platform</p>
              <p>Please do not reply to this email</p>
            </div>
          </div>
        </body>
        </html>
      `,
            attachments: resumeAttachment ? [resumeAttachment] : []
        };

        const result = await sendEmail(mailOptions);
        console.log(`✅ Job application email sent: ${result.messageId}`);

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error sending job application email:', error);
        return res.status(500).json({ error: error.message });
    }
}
