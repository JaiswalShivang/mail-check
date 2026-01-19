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
        const { userEmail, userName = 'there', alertTitle, jobs = [] } = req.body;

        if (!userEmail) return res.status(400).json({ error: 'userEmail is required' });
        if (!jobs.length) return res.status(400).json({ error: 'jobs array is required' });

        const formatSalary = (salary) => {
            if (!salary || (!salary.min && !salary.max)) return null;
            const currency = salary.currency || 'USD';
            if (salary.min && salary.max) return `${currency} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`;
            return `${currency} ${(salary.min || salary.max).toLocaleString()}`;
        };

        const jobListHtml = jobs.map((job, index) => {
            const salary = formatSalary(job.salary);
            const jobDetails = [job.location, job.employmentType, salary, job.isRemote ? 'Remote' : null].filter(Boolean).join(' • ');
            return `
        <div style="margin-bottom: 16px; background: #1c1c1e; border-radius: 12px; padding: 20px; border: 1px solid #333;">
          <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; width: 24px; height: 24px; border-radius: 6px; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold; margin-bottom: 10px;">${index + 1}</div>
          <h3 style="margin: 0 0 6px 0; color: #fff; font-size: 16px;">${job.title}</h3>
          <p style="margin: 0 0 8px 0; color: #a78bfa; font-size: 14px;">${job.company}</p>
          ${jobDetails ? `<p style="margin: 0 0 12px 0; color: #888; font-size: 12px;">${jobDetails}</p>` : ''}
          <a href="${job.applyLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">Apply Now →</a>
        </div>
      `;
        }).join('');

        const mailOptions = {
            from: `"Velocity Jobs" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `🎯 ${jobs.length} New Job${jobs.length > 1 ? 's' : ''} Matching "${alertTitle}"`,
            html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #000; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0 0 4px 0; font-size: 24px;">Velocity</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 13px;">Your Job Search Partner</p>
          </div>
          <div style="background: #111; padding: 24px; border-radius: 0 0 12px 12px;">
            <p style="color: #fff; font-size: 16px; margin: 0 0 8px 0;">Hello ${userName},</p>
            <p style="color: #aaa; font-size: 14px; margin: 0 0 20px 0;">We found <strong style="color: #fff;">${jobs.length} new job${jobs.length > 1 ? 's' : ''}</strong> matching: <span style="color: #a78bfa; background: rgba(99,102,241,0.2); padding: 4px 10px; border-radius: 6px;">${alertTitle}</span></p>
            ${jobListHtml}
            <div style="border-top: 1px solid #333; margin-top: 24px; padding-top: 16px;">
              <p style="color: #888; font-size: 13px; margin: 0;">Best of luck,<br><strong style="color: #fff;">The Velocity Team</strong></p>
            </div>
          </div>
          <p style="color: #555; font-size: 11px; text-align: center; margin-top: 16px;">© ${new Date().getFullYear()} Velocity</p>
        </div>
      `,
            text: `Hello ${userName},\n\nWe found ${jobs.length} jobs matching "${alertTitle}":\n\n${jobs.map((j, i) => `${i + 1}. ${j.title} at ${j.company}\n   Apply: ${j.applyLink}`).join('\n\n')}\n\nBest,\nVelocity Team`
        };

        const result = await sendEmail(mailOptions);
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
