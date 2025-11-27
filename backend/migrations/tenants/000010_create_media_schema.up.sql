-- Create media table
CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    media_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ready',
    visibility VARCHAR(20) NOT NULL DEFAULT 'private',
    context VARCHAR(50) NOT NULL DEFAULT 'other',
    context_id UUID,
    storage_path TEXT NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER,
    width INTEGER,
    height INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for media
CREATE INDEX IF NOT EXISTS idx_media_tenant ON media(tenant_id);
CREATE INDEX IF NOT EXISTS idx_media_user ON media(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(media_type, tenant_id);
CREATE INDEX IF NOT EXISTS idx_media_status ON media(status, tenant_id);
CREATE INDEX IF NOT EXISTS idx_media_visibility ON media(visibility, tenant_id);
CREATE INDEX IF NOT EXISTS idx_media_context ON media(context, context_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_deleted_at ON media(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_file_name ON media(file_name, tenant_id);
CREATE INDEX IF NOT EXISTS idx_media_original_name ON media(original_name, tenant_id);

-- Create media_folders table
CREATE TABLE IF NOT EXISTS media_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    parent_id UUID REFERENCES media_folders(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    path TEXT NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, path)
);

-- Create indexes for media_folders
CREATE INDEX IF NOT EXISTS idx_folders_tenant ON media_folders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON media_folders(parent_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_folders_path ON media_folders(path, tenant_id);

-- Create media_tags table
CREATE TABLE IF NOT EXISTS media_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, name)
);

-- Create indexes for media_tags
CREATE INDEX IF NOT EXISTS idx_tags_tenant ON media_tags(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON media_tags(name, tenant_id);

-- Create media_tag_associations table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS media_tag_associations (
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES media_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (media_id, tag_id)
);

-- Create indexes for media_tag_associations
CREATE INDEX IF NOT EXISTS idx_assoc_media ON media_tag_associations(media_id);
CREATE INDEX IF NOT EXISTS idx_assoc_tag ON media_tag_associations(tag_id);

-- Add comments to tables
COMMENT ON TABLE media IS 'Stores media files metadata for all types of content';
COMMENT ON TABLE media_folders IS 'Hierarchical folder structure for organizing media files';
COMMENT ON TABLE media_tags IS 'Tags for categorizing and filtering media files';
COMMENT ON TABLE media_tag_associations IS 'Many-to-many relationship between media and tags';

-- Add comments to key columns
COMMENT ON COLUMN media.media_type IS 'Type of media: image, video, audio, document, archive, other';
COMMENT ON COLUMN media.status IS 'Status: uploading, processing, ready, failed, deleted';
COMMENT ON COLUMN media.visibility IS 'Visibility: public, private';
COMMENT ON COLUMN media.context IS 'Usage context: course, lesson, assignment, profile, certificate, other';
COMMENT ON COLUMN media.storage_path IS 'Path to file in S3/MinIO storage';
COMMENT ON COLUMN media.url IS 'Public or presigned URL to access the file';
COMMENT ON COLUMN media.metadata IS 'Additional metadata in JSON format (exif, codec info, etc.)';
COMMENT ON COLUMN media_folders.path IS 'Full path from root, e.g., /folder1/folder2';
