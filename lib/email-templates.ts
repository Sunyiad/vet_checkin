import type { EmailTemplate } from "@vercel/email"

export const passwordResetEmailTemplate: EmailTemplate = {
  subject: "Reset Your Password",
  react: ({ resetLink, recipientEmail }) => (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ color: "#333" }}>Password Reset Request</h1>
      <p>Hello,</p>
      <p>We received a request to reset the password for your account ({recipientEmail}).</p>
      <p>Click the button below to reset your password:</p>
      <div style={{ textAlign: "center", margin: "30px 0" }}>
        <a
          href={resetLink}
          style={{
            backgroundColor: "#000",
            color: "#fff",
            padding: "12px 24px",
            textDecoration: "none",
            borderRadius: "4px",
            display: "inline-block",
          }}
        >
          Reset Password
        </a>
      </div>
      <p>If you didn't request a password reset, you can ignore this email. The link will expire in 24 hours.</p>
      <p>Thank you,</p>
      <p>Vet Clinic Check-in Team</p>
    </div>
  ),
  text: ({ resetLink, recipientEmail }) => `
    Password Reset Request
    
    Hello,
    
    We received a request to reset the password for your account (${recipientEmail}).
    
    Click the link below to reset your password:
    ${resetLink}
    
    If you didn't request a password reset, you can ignore this email. The link will expire in 24 hours.
    
    Thank you,
    Vet Clinic Check-in Team
  `,
}
