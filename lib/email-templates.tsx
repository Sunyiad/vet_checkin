import type * as React from "react"

// Base layout for all emails
export const EmailLayout: React.FC<{
  children: React.ReactNode
  title: string
}> = ({ children, title }) => (
  <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
    <div style={{ backgroundColor: "#000", padding: "20px", textAlign: "center" as const }}>
      <h1 style={{ color: "#fff", margin: 0 }}>Vet Clinic Check-in</h1>
    </div>
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "#333" }}>{title}</h2>
      {children}
    </div>
    <div style={{ borderTop: "1px solid #eee", padding: "20px", fontSize: "12px", color: "#666" }}>
      <p>This is an automated message from your veterinary clinic.</p>
      <p>If you have any questions, please contact us directly.</p>
    </div>
  </div>
)

// Password reset email template
export const PasswordResetEmailTemplate: React.FC<{
  resetLink: string
  recipientEmail: string
}> = ({ resetLink, recipientEmail }) => (
  <EmailLayout title="Password Reset Request">
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
  </EmailLayout>
)

// Check-in confirmation email template
export const CheckInConfirmationEmailTemplate: React.FC<{
  ownerName: string
  petName: string
  appointmentTime?: string
  doctorName?: string
}> = ({ ownerName, petName, appointmentTime, doctorName }) => (
  <EmailLayout title="Check-in Confirmation">
    <p>Hello {ownerName},</p>
    <p>Thank you for checking in {petName} at our clinic.</p>
    {appointmentTime && (
      <p>
        Your appointment is scheduled for: <strong>{appointmentTime}</strong>
      </p>
    )}
    {doctorName && (
      <p>
        You'll be seeing: <strong>Dr. {doctorName}</strong>
      </p>
    )}
    <p>If you need to cancel or reschedule, please call our office.</p>
    <p>Thank you,</p>
    <p>The Vet Clinic Team</p>
  </EmailLayout>
)

// Appointment reminder email template
export const AppointmentReminderEmailTemplate: React.FC<{
  ownerName: string
  petName: string
  appointmentDate: string
  appointmentTime?: string
  doctorName?: string
}> = ({ ownerName, petName, appointmentDate, appointmentTime, doctorName }) => (
  <EmailLayout title="Appointment Reminder">
    <p>Hello {ownerName},</p>
    <p>This is a friendly reminder about your upcoming appointment for {petName}.</p>
    <div style={{ backgroundColor: "#f5f5f5", padding: "15px", borderRadius: "5px", margin: "20px 0" }}>
      <p style={{ margin: "5px 0" }}>
        <strong>Date:</strong> {appointmentDate}
      </p>
      {appointmentTime && (
        <p style={{ margin: "5px 0" }}>
          <strong>Time:</strong> {appointmentTime}
        </p>
      )}
      {doctorName && (
        <p style={{ margin: "5px 0" }}>
          <strong>Doctor:</strong> Dr. {doctorName}
        </p>
      )}
    </div>
    <p>If you need to reschedule, please call our office at least 24 hours in advance.</p>
    <p>Thank you,</p>
    <p>The Vet Clinic Team</p>
  </EmailLayout>
)
