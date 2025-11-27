-- Drop indexes first
DROP INDEX IF EXISTS idx_assoc_tag;
DROP INDEX IF EXISTS idx_assoc_media;

DROP INDEX IF EXISTS idx_tags_name;
DROP INDEX IF EXISTS idx_tags_tenant;

DROP INDEX IF EXISTS idx_folders_path;
DROP INDEX IF EXISTS idx_folders_parent;
DROP INDEX IF EXISTS idx_folders_tenant;

DROP INDEX IF EXISTS idx_media_original_name;
DROP INDEX IF EXISTS idx_media_file_name;
DROP INDEX IF EXISTS idx_media_deleted_at;
DROP INDEX IF EXISTS idx_media_created_at;
DROP INDEX IF EXISTS idx_media_context;
DROP INDEX IF EXISTS idx_media_visibility;
DROP INDEX IF EXISTS idx_media_status;
DROP INDEX IF EXISTS idx_media_type;
DROP INDEX IF EXISTS idx_media_user;
DROP INDEX IF EXISTS idx_media_tenant;

-- Drop tables
DROP TABLE IF EXISTS media_tag_associations;
DROP TABLE IF EXISTS media_tags;
DROP TABLE IF EXISTS media_folders;
DROP TABLE IF EXISTS media;
