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
            userEmail,
            userName = 'there',
            alertTitle,
            jobs = []
        } = req.body;

        if (!userEmail) {
            return res.status(400).json({ error: 'userEmail is required' });
        }

        if (!jobs.length) {
            return res.status(400).json({ error: 'jobs array is required and must not be empty' });
        }

        console.log(`📧 Sending job alert to: ${userEmail}, Jobs: ${jobs.length}`);

        // Format salary display
        const formatSalary = (salary) => {
            if (!salary || (!salary.min && !salary.max)) return null;
            const currency = salary.currency || 'USD';
            if (salary.min && salary.max) {
                return `${currency} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`;
            }
            return `${currency} ${(salary.min || salary.max).toLocaleString()}`;
        };

        // Generate job list HTML
        const jobListHtml = jobs.map((job, index) => {
            const salary = formatSalary(job.salary);
            const jobDetails = [job.location, job.employmentType, salary, job.isRemote ? '🏠 Remote' : null].filter(Boolean).join(' • ');
            return `
        <tr>
          <td style="padding: 0 0 16px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 100%); border-radius: 16px; border: 1px solid #3a3a3c; overflow: hidden;">
              <tr>
                <td style="padding: 24px;" class="mobile-padding">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td class="mobile-stack" style="vertical-align: top;">
                        <div style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; width: 28px; height: 28px; border-radius: 8px; text-align: center; line-height: 28px; font-size: 13px; font-weight: 700; margin-bottom: 12px;">
                          ${index + 1}
                        </div>
                        <h3 style="margin: 0 0 8px 0; color: #ffffff; font-size: 18px; font-weight: 700; line-height: 1.4;" class="mobile-job-title">${job.title}</h3>
                        <p style="margin: 0 0 12px 0; color: #a78bfa; font-size: 15px; font-weight: 600;">${job.company}</p>
                        ${jobDetails ? `<p style="margin: 0 0 20px 0; color: #8e8e93; font-size: 13px; line-height: 1.6;">${jobDetails}</p>` : ''}
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td>
                              <a href="${job.applyLink}" target="_blank" class="mobile-button" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 600; letter-spacing: 0.3px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);">Apply Now →</a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
        }).join('');

        const mailOptions = {
            from: `"Velocity Jobs" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `🎯 ${jobs.length} New Job${jobs.length > 1 ? 's' : ''} Matching "${alertTitle}"`,
            html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Job Opportunities</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; }
            @media only screen and (max-width: 600px) {
              .email-container { width: 100% !important; padding: 12px !important; }
              .mobile-padding { padding: 20px 16px !important; }
              .mobile-text { font-size: 15px !important; line-height: 1.5 !important; }
              .mobile-title { font-size: 22px !important; }
              .mobile-job-title { font-size: 16px !important; }
              .mobile-stack { display: block !important; width: 100% !important; }
              .mobile-button { display: block !important; width: 100% !important; text-align: center !important; padding: 16px 24px !important; font-size: 16px !important; margin-top: 8px !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #000000; line-height: 1.6;">
          <div style="display: none; max-height: 0; overflow: hidden;">
            ${jobs.length} new job${jobs.length > 1 ? 's' : ''} matching ${alertTitle} • Review opportunities now
          </div>
          
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #000000; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background: linear-gradient(180deg, #1c1c1e 0%, #0a0a0a 100%); border-radius: 16px; border: 1px solid #2c2c2e; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);">
                  
                  <tr>
                    <td style="padding: 32px 40px 24px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%); border-radius: 16px 16px 0 0;" class="mobile-padding">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td>
                            <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;" class="mobile-title">Velocity</h1>
                            <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 500;">Your Job Search Partner</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 36px 40px;" class="mobile-padding">
                      <p style="margin: 0 0 12px 0; color: #ffffff; font-size: 18px; font-weight: 600;">Hello ${userName},</p>
                      <p style="margin: 0 0 28px 0; color: #a1a1a6; font-size: 16px; line-height: 1.6;" class="mobile-text">
                        We've found <strong style="color: #ffffff; font-weight: 600;">${jobs.length} new opportunity${jobs.length > 1 ? 's' : ''}</strong> matching your alert:
                      </p>
                      
                      <div style="margin: 0 0 28px 0; padding: 12px 18px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%); border-radius: 10px; border: 1px solid rgba(99, 102, 241, 0.3); display: inline-block;">
                        <p style="margin: 0; color: #a78bfa; font-size: 14px; font-weight: 600;">📌 ${alertTitle}</p>
                      </div>
                      
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                        ${jobListHtml}
                      </table>
                      
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #2c2c2e;">
                        <tr>
                          <td>
                            <p style="margin: 0 0 8px 0; color: #a1a1a6; font-size: 15px;">Best of luck with your applications,</p>
                            <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 600;">The Velocity Team</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 28px 40px; background-color: #0a0a0a; border-radius: 0 0 16px 16px; border-top: 1px solid #2c2c2e;" class="mobile-padding">
                      <p style="margin: 0 0 8px 0; color: #6e6e73; font-size: 13px; line-height: 1.5;">
                        You're receiving this because you created a job alert on Velocity.
                      </p>
                      <p style="margin: 0; color: #48484a; font-size: 12px; line-height: 1.5;">
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
Hello ${userName},

We found ${jobs.length} new job opportunity${jobs.length > 1 ? 's' : ''} matching your alert: "${alertTitle}"

${jobs.map((job, i) => `${i + 1}. ${job.title}\n   Company: ${job.company}${job.location ? `\n   Location: ${job.location}` : ''}\n   Apply: ${job.applyLink}`).join('\n\n')}

Best regards,
The Velocity Team
      `.trim()
        };

        const result = await sendEmail(mailOptions);
        console.log(`✅ Job alert email sent to ${userEmail}: ${result.messageId}`);

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error sending job alert email:', error);
        return res.status(500).json({ error: error.message });
    }
}
