-- Add stage column to scores table
ALTER TABLE scores ADD COLUMN IF NOT EXISTS stage text DEFAULT 'noche';

-- Drop the existing unique constraint if it exists
ALTER TABLE scores DROP CONSTRAINT IF EXISTS scores_base_team_unique;

-- Create new unique constraint including stage
ALTER TABLE scores ADD CONSTRAINT scores_base_team_stage_unique UNIQUE (base_id, team_id, stage);

-- Create index for faster queries by stage
CREATE INDEX IF NOT EXISTS idx_scores_stage ON scores(stage);
