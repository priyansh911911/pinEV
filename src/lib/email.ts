import axios from "axios";
import { toast } from "sonner";

type SendEmailProps = {
    sendTo: { name: string; email: string }[];
    subject: string;
    htmlPart: string;
};

export async function sendEmail(props: SendEmailProps) {
    const { sendTo, subject, htmlPart } = props;

    const body = {
        from: {
            name: "PIN EV",
            email: "noreply@arodos.com",
        },
        to: sendTo,
        subject: subject,
        htmlpart: htmlPart,
    };

    try {
        const res = await axios.post("https://send-email-api-v4.backendservices.in", body);

        return res.data;
    } catch (error) {
        toast.error("Could not send email");
    }
}

export const getOTPEmailTemplate = (otp: string) => {
    return `
    <div style="
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            border: 1px solid #e5e7eb;
        ">
        <!-- Header with EV App Branding -->
        <header style="
            background: linear-gradient(135deg, #04A551 0%, #007737 100%);
            padding: 32px 24px;
            text-align: center;
            position: relative;
            ">
            <h1 style="
                color: #ffffff;
                font-size: 28px;
                font-weight: 700;
                margin: 0 0 8px 0;
                letter-spacing: -0.5px;
            ">
                PIN EV
            </h1>
            <p style="
                color: rgba(255, 255, 255, 0.9);
                font-size: 16px;
                margin: 0;
                font-weight: 400;
            ">
                Your verification code is ready
            </p>
        </header>

        <!-- Main Content -->
        <div style="padding: 40px 32px;">
            <!-- Welcome Message -->
            <div style="text-align: center; margin-bottom: 32px;">
                <p style="
                font-size: 16px;
                color: #6b7280;
                margin: 0;
                line-height: 1.5;
                ">
                    We received a request to verify your email address. Use the code below to complete your verification.
                </p>
            </div>

            <!-- OTP Code Section -->
            <div style="
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                border: 2px solid #e2e8f0;
                border-radius: 16px;
                padding: 32px;
                text-align: center;
                margin: 32px 0;
                position: relative;
            ">
                <p style="
                font-size: 14px;
                color: #64748b;
                margin: 0 0 16px 0;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 1px;
                ">
                    Your Verification Code
                </p>

                <!-- OTP Display -->
                <div style="
                font-family: 'Courier New', monospace;
                font-size: 36px;
                font-weight: 700;
                color: #04A551;
                background-color: #ffffff;
                border: 3px solid #04A551;
                border-radius: 12px;
                padding: 20px;
                letter-spacing: 8px;
                margin: 16px 0;
                display: inline-block;
                min-width: 200px;
                box-shadow: 0 4px 12px rgba(4, 165, 81, 0.2);
                ">
                    ${otp}
                </div>

            </div>

            <!-- Instructions -->
            <div style="
                background-color: #fef3c7;
                border: 1px solid #fbbf24;
                border-radius: 12px;
                padding: 20px;
                margin: 24px 0;
            ">
                <div style="display: flex; align-items: flex-start; gap: 12px;">
                    <div>
                        <h3 style="
                    font-size: 16px;
                    font-weight: 600;
                    color: #92400e;
                    margin: 0 0 8px 0;
                    ">
                            Security Notice
                        </h3>
                        <p style="
                    font-size: 14px;
                    color: #92400e;
                    margin: 0;
                    line-height: 1.5;
                    ">
                            Never share this code with anyone. Our team will never ask for your verification code via phone,
                            email, or any other method.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <footer style="
            background-color: #f9fafb;
            border-top: 1px solid #e5e7eb;
            padding: 32px 24px;
            text-align: center;
            ">
            <p style="
                font-size: 12px;
                color: #9ca3af;
                margin: 0;
                line-height: 1.4;
            ">
                © ${new Date().getFullYear()} PIN EV . All rights reserved.
            </p>
        </footer>
    </div>
    `;
};
