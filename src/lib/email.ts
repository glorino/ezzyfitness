import "server-only";

const RESEND_API = "https://api.resend.com/emails";

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey || apiKey === "re_abc123xyz") {
    console.warn("RESEND_API_KEY not configured - email not sent");
    return false;
  }

  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Ezzy Fitness <noreply@ezzyfitness.com>",
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ""),
      }),
    });

    return res.ok;
  } catch (error) {
    console.error("Email send failed:", error);
    return false;
  }
}

export async function sendWelcomeEmail(email: string, name: string, tempPassword?: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #D6FF3F;">Welcome to Ezzy Fitness!</h1>
      <p>Hi ${name},</p>
      <p>Your account has been created successfully.</p>
      ${tempPassword ? `
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Your login details:</strong></p>
          <p>Email: ${email}</p>
          <p>Password: <strong>${tempPassword}</strong></p>
          <p style="color: #666; font-size: 14px;">Please change your password after first login.</p>
        </div>
      ` : ""}
      <p>You can now access your member portal at:</p>
      <a href="https://ezzyfitness.vercel.app/dashboard/member" style="background: #D6FF3F; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
        Go to Dashboard
      </a>
      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        If you have any questions, contact us at +2348000000000
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Welcome to Ezzy Fitness - Your Account Details",
    html,
  });
}

export async function sendPaymentConfirmation(email: string, name: string, amount: number, planName: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #D6FF3F;">Payment Confirmed ✓</h1>
      <p>Hi ${name},</p>
      <p>Your payment has been processed successfully.</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Payment Details:</strong></p>
        <p>Amount: ₦${amount.toLocaleString()}</p>
        <p>Plan: ${planName}</p>
        <p>Date: ${new Date().toLocaleDateString()}</p>
      </div>
      <p>Your membership has been extended.</p>
      <a href="https://ezzyfitness.vercel.app/dashboard/member/membership" style="background: #D6FF3F; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
        View Membership
      </a>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Payment Confirmation - Ezzy Fitness",
    html,
  });
}

export async function sendExpiryReminder(email: string, name: string, daysLeft: number) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #FF6B35;">Membership Expiring Soon</h1>
      <p>Hi ${name},</p>
      <p>Your membership expires in <strong>${daysLeft} days</strong>.</p>
      <p>Renew now to keep your training going without interruption.</p>
      <a href="https://ezzyfitness.vercel.app/membership" style="background: #D6FF3F; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
        Renew Now
      </a>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Your Membership Expires in ${daysLeft} Days`,
    html,
  });
}
