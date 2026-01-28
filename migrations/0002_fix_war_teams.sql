-- Add member_ids and updated_at columns to war_teams table
ALTER TABLE war_teams ADD COLUMN IF NOT EXISTS member_ids json DEFAULT '[]' NOT NULL;
ALTER TABLE war_teams ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();

-- Drop old columns if they exist
ALTER TABLE war_teams DROP COLUMN IF EXISTS name;
ALTER TABLE war_teams DROP COLUMN IF EXISTS color;
ALTER TABLE war_teams DROP COLUMN IF EXISTS logo_url;

-- Drop war_team_id from users if it exists
ALTER TABLE users DROP COLUMN IF EXISTS war_team_id;
