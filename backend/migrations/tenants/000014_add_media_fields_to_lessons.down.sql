-- Rollback media fields from lessons table

-- Drop index first
DROP INDEX IF EXISTS idx_lessons_media_id;

-- Drop columns
ALTER TABLE lessons DROP COLUMN IF EXISTS video_url;
ALTER TABLE lessons DROP COLUMN IF EXISTS media_id;
