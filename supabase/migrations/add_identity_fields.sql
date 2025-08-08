-- Add identity verification fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS ens_name TEXT,
ADD COLUMN IF NOT EXISTS basename TEXT,
ADD COLUMN IF NOT EXISTS has_ens BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_basename BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS power_badge BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_wallets TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS identity_verified_at TIMESTAMPTZ;

-- Create index for ENS and Basename lookups
CREATE INDEX IF NOT EXISTS idx_users_ens_name ON users(ens_name);
CREATE INDEX IF NOT EXISTS idx_users_basename ON users(basename);
CREATE INDEX IF NOT EXISTS idx_users_identity_verification ON users(has_ens, has_basename, power_badge);

-- Update existing users to track multiple verified wallets
UPDATE users 
SET verified_wallets = ARRAY[verified_wallet]
WHERE verified_wallet IS NOT NULL 
  AND verified_wallets = '{}';

-- Add comments for documentation
COMMENT ON COLUMN users.ens_name IS 'ENS domain name if user owns one';
COMMENT ON COLUMN users.basename IS 'Base domain name (.base.eth) if user owns one';
COMMENT ON COLUMN users.has_ens IS 'Whether user has verified ENS ownership';
COMMENT ON COLUMN users.has_basename IS 'Whether user has verified Basename ownership';
COMMENT ON COLUMN users.power_badge IS 'Whether user has Farcaster power badge (400+ followers)';
COMMENT ON COLUMN users.verified_wallets IS 'Array of all verified wallet addresses from Farcaster';
COMMENT ON COLUMN users.identity_verified_at IS 'When identity signals were last verified';