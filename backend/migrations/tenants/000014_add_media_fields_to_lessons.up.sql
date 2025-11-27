-- Add media fields to lessons table for video integration
-- This migration adds support for linking lessons to uploaded media files

-- Add media_id column to reference media table
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS media_id UUID REFERENCES media(id) ON DELETE SET NULL;

-- Add video_url column for pre-signed URLs
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS video_url VARCHAR(500);

-- Create index on media_id for better query performance
CREATE INDEX IF NOT EXISTS idx_lessons_media_id
ON lessons(media_id)
WHERE media_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN lessons.media_id IS 'Reference to uploaded video in media table';
COMMENT ON COLUMN lessons.video_url IS 'Pre-signed URL for video playback (generated from media)';
