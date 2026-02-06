import { sendEmail } from "../email";
import { getSupportAdminTemplate, getSupportUserTemplate } from "./templates";

/**
 * Main Support Logic: Notifies Admin and Sends Confirmation to User
 */
export async function createSupportTicket(data: { name: string; email: string; phone: string; issue: string }) {
    const ticketId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestamp = new Date().toLocaleString();

    // 1. Notify Support Team
    const adminEmail = sendEmail({
        sendTo: [{ name: "PIN EV Support", email: "pincustomercare@gmail.com" }],
        subject: `[TICKET #${ticketId}] - Support Request from ${data.name}`,
        htmlPart: getSupportAdminTemplate({ ...data, ticketId, timestamp })
    });

    // 2. Confirm to User
    const userEmail = sendEmail({
        sendTo: [{ name: data.name, email: data.email }],
        subject: `We're on it! Support Ticket #${ticketId}`,
        htmlPart: getSupportUserTemplate({ ...data, ticketId })
    });

    return await Promise.all([adminEmail, userEmail]);
}
