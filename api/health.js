export default async function handler(req, res) {
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
