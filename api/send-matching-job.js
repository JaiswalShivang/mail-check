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
    const { userEmail, userName = 'there', jobTitle, companyName, jobDescription, jobLocation, jobType, salary, applyLink, postedDate } = req.body;

    if (!userEmail || !jobTitle || !companyName || !applyLink) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const formatSalary = (sal) => {
      if (!sal) return null;
      if (typeof sal === 'string') return sal;
      if (sal.min && sal.max) return `${sal.currency || 'USD'} ${sal.min.toLocaleString()} - ${sal.max.toLocaleString()}`;
      return null;
    };

    const formattedSalary = formatSalary(salary);
    const jobDetails = [jobLocation, jobType, formattedSalary].filter(Boolean).join(' • ');

    const mailOptions = {
      from: `"Velocity Jobs" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `🎯 New Job Match: ${jobTitle} at ${companyName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #000; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0 0 4px 0; font-size: 24px;">Velocity</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 13px;">We found a job that matches your profile!</p>
          </div>
          <div style="background: #111; padding: 24px; border-radius: 0 0 12px 12px;">
            <p style="color: #fff; font-size: 16px; margin: 0 0 16px 0;">Hello ${userName},</p>
            <div style="background: #1c1c1e; border-radius: 12px; padding: 20px; border: 1px solid #333;">
              <h2 style="margin: 0 0 6px 0; color: #fff; font-size: 18px;">${jobTitle}</h2>
              <p style="margin: 0 0 10px 0; color: #8b5cf6; font-size: 14px; font-weight: 600;">${companyName}</p>
              ${jobDetails ? `<p style="margin: 0 0 12px 0; color: #888; font-size: 12px;">📍 ${jobDetails}</p>` : ''}
              ${jobDescription ? `<div style="background: rgba(99,102,241,0.1); padding: 12px; border-radius: 8px; border-left: 3px solid #6366f1; margin: 12px 0;"><p style="margin: 0; color: #aaa; font-size: 13px;">${jobDescription.substring(0, 200)}${jobDescription.length > 200 ? '...' : ''}</p></div>` : ''}
              ${postedDate ? `<p style="margin: 12px 0; color: #666; font-size: 12px;">🕐 Posted: ${new Date(postedDate).toLocaleDateString()}</p>` : ''}
              <a href="${applyLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 600; margin-top: 8px;">Apply Now →</a>
            </div>
            <div style="border-top: 1px solid #333; margin-top: 24px; padding-top: 16px;">
              <p style="color: #888; font-size: 13px; margin: 0;">Best of luck,<br><strong style="color: #fff;">The Velocity Team</strong></p>
            </div>
          </div>
        </div>
      `,
      text: `Hello ${userName},\n\n${jobTitle} at ${companyName}\n${jobDetails || ''}\n\nApply: ${applyLink}\n\nBest,\nVelocity Team`
    };

    const result = await sendEmail(mailOptions);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
