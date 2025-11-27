-- Revert Courses Schema Extensions

-- Drop indexes
DROP INDEX IF EXISTS idx_courses_tenant;
DROP INDEX IF EXISTS idx_courses_category;
DROP INDEX IF EXISTS idx_courses_slug;
DROP INDEX IF EXISTS idx_courses_published;
DROP INDEX IF EXISTS idx_courses_level;
DROP INDEX IF EXISTS idx_courses_price;
DROP INDEX IF EXISTS idx_courses_rating;
DROP INDEX IF EXISTS idx_courses_deleted;

DROP INDEX IF EXISTS idx_course_categories_tenant;
DROP INDEX IF EXISTS idx_course_categories_slug;
DROP INDEX IF EXISTS idx_course_categories_parent;
DROP INDEX IF EXISTS idx_course_categories_active;
DROP INDEX IF EXISTS idx_course_categories_order;

-- Drop constraints
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_slug_unique;
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_price_positive;
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_enrollment_count_positive;
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_rating_range;
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_rating_count_positive;

-- Remove foreign key to course_categories before dropping the table
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_category_id_fkey;

-- Revert column changes
ALTER TABLE courses DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE courses DROP COLUMN IF EXISTS slug;
ALTER TABLE courses DROP COLUMN IF EXISTS category_id;
ALTER TABLE courses DROP COLUMN IF EXISTS price;
ALTER TABLE courses DROP COLUMN IF EXISTS thumbnail;
ALTER TABLE courses DROP COLUMN IF EXISTS preview_video;
ALTER TABLE courses DROP COLUMN IF EXISTS requirements;
ALTER TABLE courses DROP COLUMN IF EXISTS what_you_will_learn;
ALTER TABLE courses DROP COLUMN IF EXISTS target_audience;
ALTER TABLE courses DROP COLUMN IF EXISTS enrollment_count;
ALTER TABLE courses DROP COLUMN IF EXISTS rating;
ALTER TABLE courses DROP COLUMN IF EXISTS rating_count;
ALTER TABLE courses DROP COLUMN IF EXISTS deleted_at;

-- Revert duration column name
ALTER TABLE courses RENAME COLUMN duration TO duration_hours;

-- Add back removed columns
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_name VARCHAR(255);

-- Revert constraints to original
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_level_check;
ALTER TABLE courses ADD CONSTRAINT courses_level_check
    CHECK (level IN ('beginner', 'intermediate', 'advanced'));

ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_status_check;
ALTER TABLE courses ADD CONSTRAINT courses_status_check
    CHECK (status IN ('draft', 'published', 'archived'));

-- Drop course_categories table
DROP TRIGGER IF EXISTS update_course_categories_updated_at ON course_categories;
DROP TABLE IF EXISTS course_categories CASCADE;
