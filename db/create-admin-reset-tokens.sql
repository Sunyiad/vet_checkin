-- Create admin_reset_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS admin_reset_tokens_token_idx ON admin_reset_tokens(token);
CREATE INDEX IF NOT EXISTS admin_reset_tokens_email_idx ON admin_reset_tokens(email);

-- Add a comment to the table
COMMENT ON TABLE admin_reset_tokens IS 'Stores password reset tokens for admin users';
