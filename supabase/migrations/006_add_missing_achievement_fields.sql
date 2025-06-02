-- Migration: Add missing fields to user_achievements table
-- This adds the achievement_description and achievement_code fields that the code expects

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add achievement_description column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_achievements' 
        AND column_name = 'achievement_description'
    ) THEN
        ALTER TABLE user_achievements 
        ADD COLUMN achievement_description TEXT;
    END IF;

    -- Add achievement_code column for unique identification
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_achievements' 
        AND column_name = 'achievement_code'
    ) THEN
        ALTER TABLE user_achievements 
        ADD COLUMN achievement_code TEXT;
    END IF;
END $$;

-- Update existing achievements with generated names and descriptions
UPDATE user_achievements 
SET 
    achievement_name = CASE 
        WHEN achievement_name IS NULL OR achievement_name = '' THEN
            CASE 
                WHEN achievement_type = 'general' AND category = 'milestone' AND rarity = 'rare' THEN '💎 Rare Milestone Achievement'
                WHEN achievement_type = 'general' AND category = 'milestone' AND rarity = 'uncommon' THEN '🔥 Uncommon Milestone Achievement'
                WHEN achievement_type = 'general' AND category = 'milestone' AND rarity = 'common' THEN '🏆 Milestone Achievement'
                WHEN achievement_type = 'general' AND category = 'milestone' THEN '🏆 Milestone Achievement'
                WHEN achievement_type = 'general' THEN '🏆 Achievement Unlocked'
                ELSE '🏆 Achievement Unlocked'
            END
        ELSE achievement_name
    END,
    achievement_description = CASE 
        WHEN achievement_description IS NULL OR achievement_description = '' THEN
            CASE 
                WHEN achievement_type = 'general' AND category = 'milestone' THEN 'Reached an important milestone in your learning journey'
                WHEN achievement_type = 'general' THEN 'Completed a significant milestone'
                ELSE 'You have unlocked a new achievement!'
            END
        ELSE achievement_description
    END,
    achievement_code = CASE 
        WHEN achievement_code IS NULL OR achievement_code = '' THEN
            CASE 
                WHEN achievement_type = 'general' AND category = 'milestone' THEN 'milestone-' || rarity || '-' || id::text
                ELSE 'general-' || id::text
            END
        ELSE achievement_code
    END
WHERE (achievement_name IS NULL OR achievement_name = '') 
   OR (achievement_description IS NULL OR achievement_description = '')
   OR (achievement_code IS NULL OR achievement_code = '');

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_code ON user_achievements(achievement_code);
CREATE INDEX IF NOT EXISTS idx_user_achievements_type_category ON user_achievements(achievement_type, category);

-- Add comments
COMMENT ON COLUMN user_achievements.achievement_name IS 'Display name for the achievement';
COMMENT ON COLUMN user_achievements.achievement_description IS 'Description of what the achievement represents';
COMMENT ON COLUMN user_achievements.achievement_code IS 'Unique code identifier for the achievement'; 