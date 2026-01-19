import { verifyApiKey, sendEmail, corsHeaders } from '../lib/emailUtils.js';

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
            studentEmail,
            studentName = 'there',
            challengeTitle,
            companyName,
            corporateName,
            proposedPrice,
            estimatedDays,
            feedback = '',
            chatRoomId,
            frontendUrl
        } = req.body;

        if (!studentEmail) {
            return res.status(400).json({ error: 'studentEmail is required' });
        }

        if (!challengeTitle || !companyName || !proposedPrice || !estimatedDays) {
            return res.status(400).json({ error: 'challengeTitle, companyName, proposedPrice, and estimatedDays are required' });
        }

        const FRONTEND_URL = frontendUrl || process.env.FRONTEND_URL || 'http://localhost:5173';

        console.log(`📧 Sending proposal approval email to: ${studentEmail}`);

        const mailOptions = {
            from: `"Velocity Fellowships" <${process.env.EMAIL_USER}>`,
            to: studentEmail,
            subject: `🎉 Congratulations! Your Proposal Has Been Accepted`,
            html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Proposal Accepted</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
            @media only screen and (max-width: 600px) {
              .email-container { width: 100% !important; padding: 16px !important; }
              .mobile-padding { padding: 24px 20px !important; }
              .mobile-text { font-size: 15px !important; }
              .mobile-title { font-size: 24px !important; }
            }
          </style>
        </head>
        <body style="background-color: #f3f4f6; padding: 40px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center">
                <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background: white; border-radius: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden;">
                  
                  <tr>
                    <td style="padding: 40px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); text-align: center;" class="mobile-padding">
                      <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
                      <h1 style="margin: 0 0 8px 0; color: white; font-size: 28px; font-weight: 700;" class="mobile-title">Proposal Accepted!</h1>
                      <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">Great news from Velocity Fellowships</p>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 40px;" class="mobile-padding">
                      <p style="margin: 0 0 24px 0; color: #111827; font-size: 18px; font-weight: 600;">Hello ${studentName},</p>
                      
                      <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;" class="mobile-text">
                        Congratulations! <strong style="color: #111827;">${companyName}</strong> has accepted your proposal for the challenge:
                      </p>
                      
                      <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin-bottom: 28px;">
                        <h3 style="margin: 0 0 12px 0; color: #047857; font-size: 18px; font-weight: 600;">${challengeTitle}</h3>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 8px 0; color: #065f46; font-size: 14px;">
                              <strong>💰 Agreed Price:</strong> ₹${proposedPrice.toLocaleString()}
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #065f46; font-size: 14px;">
                              <strong>⏱️ Timeline:</strong> ${estimatedDays} day${estimatedDays > 1 ? 's' : ''}
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #065f46; font-size: 14px;">
                              <strong>🏢 Company:</strong> ${companyName}
                            </td>
                          </tr>
                        </table>
                      </div>
                      
                      ${feedback ? `
                      <div style="background: #f9fafb; border-left: 4px solid #6366f1; padding: 20px; border-radius: 8px; margin-bottom: 28px;">
                        <h4 style="margin: 0 0 12px 0; color: #4338ca; font-size: 16px; font-weight: 600;">Message from ${corporateName}:</h4>
                        <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6;">${feedback}</p>
                      </div>
                      ` : ''}
                      
                      <div style="background: #eff6ff; border-radius: 8px; padding: 20px; margin-bottom: 28px;">
                        <h3 style="margin: 0 0 16px 0; color: #1e40af; font-size: 18px; font-weight: 600;">📋 Next Steps:</h3>
                        <ul style="margin: 0; padding-left: 20px; color: #1e3a8a; font-size: 15px; line-height: 1.8;">
                          <li>Start a conversation with ${companyName} to discuss project details</li>
                          <li>Clarify requirements and deliverables</li>
                          <li>Set up milestones and checkpoints</li>
                          <li>Begin working on the project</li>
                        </ul>
                      </div>
                      
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                        <tr>
                          <td align="center">
                            <a href="${FRONTEND_URL}/fellowship/messages/${chatRoomId}" 
                               style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 32px; border-radius: 10px; text-decoration: none; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                              Start Conversation →
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 32px;">
                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 15px;">Best of luck with your project!</p>
                        <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 600;">The Velocity Team</p>
                      </div>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;" class="mobile-padding">
                      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; text-align: center;">
                        You're receiving this because your proposal was accepted on Velocity Fellowships.
                      </p>
                      <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                        © ${new Date().getFullYear()} Velocity. All rights reserved.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
            text: `
Congratulations ${studentName}!

Your proposal has been accepted by ${companyName}!

Challenge: ${challengeTitle}
Agreed Price: ₹${proposedPrice.toLocaleString()}
Timeline: ${estimatedDays} day${estimatedDays > 1 ? 's' : ''}
${feedback ? `\nMessage from ${corporateName}:\n${feedback}` : ''}

Next Steps:
- Start a conversation with ${companyName} to discuss project details
- Clarify requirements and deliverables
- Set up milestones and checkpoints
- Begin working on the project

Click here to start the conversation: ${FRONTEND_URL}/fellowship/messages/${chatRoomId}

Best of luck with your project!
The Velocity Team
      `.trim()
        };

        const result = await sendEmail(mailOptions);
        console.log(`✅ Proposal approval email sent to ${studentEmail}: ${result.messageId}`);

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error sending proposal approval email:', error);
        return res.status(500).json({ error: error.message });
    }
}
