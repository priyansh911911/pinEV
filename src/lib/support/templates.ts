/**
 * Template for Support Ticket Acknowledgement (Sent to User)
 */
export const getSupportUserTemplate = (data: { ticketId: string; name: string; issue: string }) => {
    return `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: #04A551; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Support Ticket Received</h1>
        </div>
        <div style="padding: 32px; color: #374151; line-height: 1.6;">
            <p>Hi <strong>${data.name}</strong>,</p>
            <p>We've received your support request regarding PIN EV. Our team is looking into it and will get back to you shortly.</p>
            
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0; font-size: 14px; color: #64748b;">Ticket Reference:</p>
                <p style="margin: 4px 0 16px 0; font-weight: 700; color: #04A551; font-size: 18px;">#${data.ticketId}</p>
                
                <p style="margin: 0; font-size: 14px; color: #64748b;">Description of Issue:</p>
                <p style="margin: 4px 0 0 0; font-style: italic;">"${data.issue}"</p>
            </div>

            <p>Need immediate help? You can also reply to this email.</p>
        </div>
        <footer style="background: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #9ca3af;">
            PIN EV Support Team • 24/7 Roadside & App Support
        </footer>
    </div>
    `;
};

/**
 * Template for Support Notification (Sent to Support Team/Owner)
 */
export const getSupportAdminTemplate = (data: { ticketId: string; name: string; email: string; phone: string; issue: string; timestamp: string }) => {
    return `
    <div style="font-family: sans-serif; padding: 20px; border: 2px solid #ef4444; border-radius: 10px;">
        <h2 style="color: #ef4444;">🚨 NEW SUPPORT TICKET #${data.ticketId}</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>User:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.name}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Contact:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.phone} / ${data.email}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Time:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.timestamp}</td></tr>
        </table>
        <div style="margin-top: 20px; padding: 15px; background: #fff5f5; border-left: 4px solid #ef4444;">
            <strong>Issue Description:</strong><br/>
            ${data.issue}
        </div>
    </div>
    `;
};
