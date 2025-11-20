-- Extend Courses Schema for Enhanced Course Management
-- Adds categories, extended course fields, ratings, and improved structure

-- Create course_categories table
CREATE TABLE IF NOT EXISTS course_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES course_categories(id) ON DELETE SET NULL,
    icon VARCHAR(100),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    course_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT course_categories_slug_unique UNIQUE (tenant_id, slug),
    CONSTRAINT course_categories_display_order_positive CHECK (display_order >= 0),
    CONSTRAINT course_categories_course_count_positive CHECK (course_count >= 0)
);

-- Add extended fields to courses table (tenant_id and deleted_at already exist from migration 000001)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS slug VARCHAR(200);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES course_categories(id) ON DELETE SET NULL;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail VARCHAR(500);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS preview_video VARCHAR(500);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '[]'::jsonb;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS what_you_will_learn JSONB DEFAULT '[]'::jsonb;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS target_audience JSONB DEFAULT '[]'::jsonb;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS enrollment_count INTEGER DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- Add new constraints
ALTER TABLE courses ADD CONSTRAINT IF NOT EXISTS courses_slug_unique UNIQUE (tenant_id, slug);
ALTER TABLE courses ADD CONSTRAINT IF NOT EXISTS courses_price_positive CHECK (price >= 0);
ALTER TABLE courses ADD CONSTRAINT IF NOT EXISTS courses_enrollment_count_positive CHECK (enrollment_count >= 0);
ALTER TABLE courses ADD CONSTRAINT IF NOT EXISTS courses_rating_range CHECK (rating >= 0 AND rating <= 5);
ALTER TABLE courses ADD CONSTRAINT IF NOT EXISTS courses_rating_count_positive CHECK (rating_count >= 0);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(tenant_id, is_published) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_price ON courses(price);
CREATE INDEX IF NOT EXISTS idx_courses_rating ON courses(rating);

-- Create indexes for course_categories
CREATE INDEX IF NOT EXISTS idx_course_categories_tenant ON course_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_course_categories_slug ON course_categories(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_course_categories_parent ON course_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_course_categories_active ON course_categories(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_course_categories_order ON course_categories(tenant_id, display_order);

-- Trigger for course_categories updated_at
CREATE TRIGGER update_course_categories_updated_at
    BEFORE UPDATE ON course_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE course_categories IS 'Categories for organizing courses hierarchically';
COMMENT ON COLUMN courses.slug IS 'URL-friendly identifier for the course';
COMMENT ON COLUMN courses.category_id IS 'Reference to course category';
COMMENT ON COLUMN courses.price IS 'Course price in USD (0 for free courses)';
COMMENT ON COLUMN courses.requirements IS 'JSON array of course prerequisites';
COMMENT ON COLUMN courses.what_you_will_learn IS 'JSON array of learning outcomes';
COMMENT ON COLUMN courses.target_audience IS 'JSON array describing target audience';
COMMENT ON COLUMN courses.enrollment_count IS 'Total number of enrollments';
COMMENT ON COLUMN courses.rating IS 'Average course rating (0-5)';
COMMENT ON COLUMN courses.rating_count IS 'Number of ratings received';
COMMENT ON COLUMN courses.deleted_at IS 'Timestamp of soft deletion';
COMMENT ON COLUMN course_categories.parent_id IS 'Reference to parent category for hierarchy';
COMMENT ON COLUMN course_categories.course_count IS 'Number of courses in this category';
