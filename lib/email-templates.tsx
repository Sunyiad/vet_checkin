import type * as React from "react"

export const AdminResetPasswordEmail = ({ resetUrl }: { resetUrl: string }) => (
  <div>
    <h1>Reset Your Admin Password</h1>
    <p>You requested to reset your password for the Vet Check-in admin portal.</p>
    <p>Click the link below to reset your password:</p>
    <a href={resetUrl}>{resetUrl}</a>
    <p>This link will expire in 24 hours.</p>
    <p>If you didn't request this, you can safely ignore this email.</p>
  </div>
)

export const CheckInConfirmationEmail = ({
  petName,
  ownerName,
  clinicName,
  appointmentTime,
}: {
  petName: string
  ownerName: string
  clinicName: string
  appointmentTime?: string
}) => (
  <div>
    <h1>Check-in Confirmation</h1>
    <p>Hello {ownerName},</p>
    <p>
      Thank you for checking in {petName} at {clinicName}.
    </p>
    {appointmentTime && <p>Your appointment is scheduled for: {appointmentTime}</p>}
    <p>The veterinary team has been notified and will be with you shortly.</p>
    <p>Thank you for choosing our clinic!</p>
  </div>
)

// Keep the PasswordResetEmailTemplate for backward compatibility
export const PasswordResetEmailTemplate: React.FC<{
  resetLink: string
  recipientEmail: string
}> = ({ resetLink, recipientEmail }) => (
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
)
