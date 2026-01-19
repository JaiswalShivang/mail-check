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
    const { studentEmail, studentName = 'there', challengeTitle, companyName, corporateName, proposedPrice, estimatedDays, feedback = '', chatRoomId, frontendUrl } = req.body;

    if (!studentEmail || !challengeTitle || !companyName || !proposedPrice || !estimatedDays) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const FRONTEND_URL = frontendUrl || process.env.FRONTEND_URL || 'http://localhost:5173';

    const mailOptions = {
      from: `"Velocity Fellowships" <${process.env.EMAIL_USER}>`,
      to: studentEmail,
      subject: `🎉 Congratulations! Your Proposal Has Been Accepted`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #f3f4f6; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
            <div style="font-size: 40px; margin-bottom: 12px;">🎉</div>
            <h1 style="color: white; margin: 0 0 4px 0; font-size: 24px;">Proposal Accepted!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px;">Great news from Velocity Fellowships</p>
          </div>
          <div style="background: white; padding: 28px; border-radius: 0 0 12px 12px;">
            <p style="color: #111; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">Hello ${studentName},</p>
            <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">Congratulations! <strong style="color: #111;">${companyName}</strong> has accepted your proposal for the challenge:</p>
            
            <div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-left: 4px solid #10b981; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 10px 0; color: #047857; font-size: 16px;">${challengeTitle}</h3>
              <p style="margin: 4px 0; color: #065f46; font-size: 13px;">💰 <strong>Agreed Price:</strong> ₹${proposedPrice.toLocaleString()}</p>
              <p style="margin: 4px 0; color: #065f46; font-size: 13px;">⏱️ <strong>Timeline:</strong> ${estimatedDays} day${estimatedDays > 1 ? 's' : ''}</p>
              <p style="margin: 4px 0; color: #065f46; font-size: 13px;">🏢 <strong>Company:</strong> ${companyName}</p>
            </div>
            
            ${feedback ? `<div style="background: #f9fafb; border-left: 4px solid #6366f1; padding: 16px; border-radius: 8px; margin-bottom: 20px;"><p style="margin: 0 0 6px 0; color: #4338ca; font-size: 14px; font-weight: 600;">Message from ${corporateName}:</p><p style="margin: 0; color: #555; font-size: 13px;">${feedback}</p></div>` : ''}
            
            <div style="background: #eff6ff; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <h4 style="margin: 0 0 10px 0; color: #1e40af; font-size: 14px;">📋 Next Steps:</h4>
              <ul style="margin: 0; padding-left: 18px; color: #1e3a8a; font-size: 13px; line-height: 1.8;">
                <li>Start a conversation with ${companyName}</li>
                <li>Clarify requirements and deliverables</li>
                <li>Set up milestones and checkpoints</li>
                <li>Begin working on the project</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 24px 0;">
              <a href="${FRONTEND_URL}/fellowship/messages/${chatRoomId}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 600;">Start Conversation →</a>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 16px;">
              <p style="color: #666; font-size: 13px; margin: 0;">Best of luck,<br><strong style="color: #111;">The Velocity Team</strong></p>
            </div>
          </div>
          <p style="color: #999; font-size: 11px; text-align: center; margin-top: 16px;">© ${new Date().getFullYear()} Velocity</p>
        </div>
      `,
      text: `Congratulations ${studentName}!\n\nYour proposal for "${challengeTitle}" has been accepted by ${companyName}!\n\nAgreed Price: ₹${proposedPrice.toLocaleString()}\nTimeline: ${estimatedDays} days\n${feedback ? `\nMessage: ${feedback}` : ''}\n\nStart conversation: ${FRONTEND_URL}/fellowship/messages/${chatRoomId}\n\nBest,\nVelocity Team`
    };

    const result = await sendEmail(mailOptions);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
