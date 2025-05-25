-- Create calendar_accounts table
CREATE TABLE calendar_accounts (
    id SERIAL PRIMARY KEY,
    provider VARCHAR(50) NOT NULL, -- 'microsoft' or 'google'
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_to TIMESTAMP WITH TIME ZONE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_calendar_accounts_user_id ON calendar_accounts(user_id);

-- Add trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_calendar_accounts_updated_at
    BEFORE UPDATE ON calendar_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to fap_user
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO fap_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON calendar_accounts TO fap_user; 