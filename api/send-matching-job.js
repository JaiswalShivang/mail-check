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
            jobTitle,
            companyName,
            jobDescription,
            jobLocation,
            jobType,
            salary,
            applyLink,
            postedDate
        } = req.body;

        if (!userEmail) {
            return res.status(400).json({ error: 'userEmail is required' });
        }

        if (!jobTitle || !companyName || !applyLink) {
            return res.status(400).json({ error: 'jobTitle, companyName, and applyLink are required' });
        }

        console.log(`📧 Sending matching job email to: ${userEmail}`);

        // Format salary display
        const formatSalary = (sal) => {
            if (!sal) return null;
            if (typeof sal === 'string') return sal;
            if (sal.min && sal.max) {
                const currency = sal.currency || 'USD';
                return `${currency} ${sal.min.toLocaleString()} - ${sal.max.toLocaleString()}`;
            }
            return null;
        };

        const formattedSalary = formatSalary(salary);
        const jobDetails = [jobLocation, jobType, formattedSalary].filter(Boolean).join(' • ');

        const mailOptions = {
            from: `"Velocity Jobs" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `🎯 New Job Match: ${jobTitle} at ${companyName}`,
            html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Job Match</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; }
            @media only screen and (max-width: 600px) {
              .email-container { width: 100% !important; padding: 16px !important; }
              .mobile-padding { padding: 24px 20px !important; }
              .mobile-text { font-size: 15px !important; line-height: 1.5 !important; }
              .mobile-title { font-size: 22px !important; }
              .mobile-job-title { font-size: 20px !important; }
              .mobile-button { display: block !important; width: 100% !important; text-align: center !important; padding: 16px 24px !important; font-size: 16px !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #000000;">
          <div style="display: none; max-height: 0; overflow: hidden;">
            ${jobTitle} at ${companyName} ${jobLocation ? `• ${jobLocation}` : ''} - Apply now on Velocity
          </div>
          
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #000000; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background: linear-gradient(180deg, #1c1c1e 0%, #0a0a0a 100%); border-radius: 20px; border: 1px solid #2c2c2e; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4); overflow: hidden;">
                  
                  <tr>
                    <td style="padding: 36px 40px 28px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);" class="mobile-padding">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td>
                            <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;" class="mobile-title">Velocity</h1>
                            <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 500;">We found a job that matches your profile!</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 40px;" class="mobile-padding">
                      <p style="margin: 0 0 16px 0; color: #ffffff; font-size: 18px; font-weight: 600;">Hello ${userName},</p>
                      <p style="margin: 0 0 32px 0; color: #a1a1a6; font-size: 16px; line-height: 1.6;" class="mobile-text">
                        Great news! We found a job opportunity that matches your preferences. Check it out below:
                      </p>
                      
                      <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 100%); border-radius: 16px; border: 1px solid #3a3a3c; overflow: hidden; margin-bottom: 32px;">
                        <tr>
                          <td style="padding: 28px;" class="mobile-padding">
                            <h2 style="margin: 0 0 8px 0; color: #ffffff; font-size: 22px; font-weight: 700; line-height: 1.3;" class="mobile-job-title">${jobTitle}</h2>
                            <p style="margin: 0 0 16px 0; color: #8b5cf6; font-size: 16px; font-weight: 600;">${companyName}</p>
                            
                            ${jobDetails ? `<p style="margin: 0 0 20px 0; color: #8e8e93; font-size: 14px; line-height: 1.5;">📍 ${jobDetails}</p>` : ''}
                            
                            ${jobDescription ? `
                            <div style="margin: 0 0 24px 0; padding: 16px; background-color: rgba(99, 102, 241, 0.1); border-radius: 12px; border-left: 3px solid #6366f1;">
                              <p style="margin: 0; color: #a1a1a6; font-size: 14px; line-height: 1.6;">
                                ${jobDescription.length > 200 ? jobDescription.substring(0, 200) + '...' : jobDescription}
                              </p>
                            </div>
                            ` : ''}
                            
                            ${postedDate ? `<p style="margin: 0 0 24px 0; color: #6e6e73; font-size: 13px;">🕐 Posted: ${new Date(postedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>` : ''}
                            
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td align="center">
                                  <a href="${applyLink}" target="_blank" class="mobile-button" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: 600; letter-spacing: 0.3px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);">Apply Now →</a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <table width="100%" cellpadding="0" cellspacing="0" style="padding-top: 24px; border-top: 1px solid #2c2c2e;">
                        <tr>
                          <td>
                            <p style="margin: 0 0 8px 0; color: #a1a1a6; font-size: 15px;">Best of luck with your application!</p>
                            <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 600;">The Velocity Team</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 28px 40px; background-color: #0a0a0a; border-top: 1px solid #2c2c2e;" class="mobile-padding">
                      <p style="margin: 0 0 8px 0; color: #6e6e73; font-size: 13px; line-height: 1.5;">
                        You're receiving this because your profile matches this job.
                      </p>
                      <p style="margin: 0; color: #48484a; font-size: 12px;">
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

Great news! We found a job opportunity that matches your preferences.

${jobTitle}
${companyName}
${jobDetails || ''}

${jobDescription ? `Description: ${jobDescription.substring(0, 300)}${jobDescription.length > 300 ? '...' : ''}` : ''}

Apply here: ${applyLink}

Best of luck with your application!
The Velocity Team
      `.trim()
        };

        const result = await sendEmail(mailOptions);
        console.log(`✅ Matching job email sent to ${userEmail}: ${result.messageId}`);

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error sending matching job email:', error);
        return res.status(500).json({ error: error.message });
    }
}
