-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    comment TEXT,
    is_public BOOLEAN NOT NULL DEFAULT true,
    is_edited BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT reviews_user_course_unique UNIQUE (tenant_id, user_id, course_id, deleted_at),
    CONSTRAINT reviews_title_length CHECK (title IS NULL OR LENGTH(TRIM(title)) <= 200),
    CONSTRAINT reviews_comment_length CHECK (comment IS NULL OR LENGTH(TRIM(comment)) >= 10)
);

-- Create course_ratings table for aggregated rating data
CREATE TABLE IF NOT EXISTS course_ratings (
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    average_rating DECIMAL(3,2) NOT NULL DEFAULT 0.00 CHECK (average_rating >= 0 AND average_rating <= 5),
    total_reviews INTEGER NOT NULL DEFAULT 0 CHECK (total_reviews >= 0),
    rating_5_stars INTEGER NOT NULL DEFAULT 0 CHECK (rating_5_stars >= 0),
    rating_4_stars INTEGER NOT NULL DEFAULT 0 CHECK (rating_4_stars >= 0),
    rating_3_stars INTEGER NOT NULL DEFAULT 0 CHECK (rating_3_stars >= 0),
    rating_2_stars INTEGER NOT NULL DEFAULT 0 CHECK (rating_2_stars >= 0),
    rating_1_star INTEGER NOT NULL DEFAULT 0 CHECK (rating_1_star >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id, course_id),
    CONSTRAINT course_ratings_total_matches_sum CHECK (
        total_reviews = rating_5_stars + rating_4_stars + rating_3_stars + rating_2_stars + rating_1_star
    )
);

-- Create review_helpful table for helpful/unhelpful votes
CREATE TABLE IF NOT EXISTS review_helpful (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT review_helpful_user_review_unique UNIQUE (tenant_id, review_id, user_id)
);

-- Create review_reports table for reporting inappropriate reviews
CREATE TABLE IF NOT EXISTS review_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT review_reports_user_review_unique UNIQUE (tenant_id, review_id, reporter_id),
    CONSTRAINT review_reports_reason_not_empty CHECK (LENGTH(TRIM(reason)) > 0),
    CONSTRAINT review_reports_reason_length CHECK (LENGTH(TRIM(reason)) <= 1000)
);

-- Create indexes for performance
-- Reviews indexes
CREATE INDEX idx_reviews_tenant_id ON reviews(tenant_id);
CREATE INDEX idx_reviews_course_id ON reviews(course_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_tenant_course ON reviews(tenant_id, course_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reviews_tenant_user ON reviews(tenant_id, user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reviews_tenant_course_user ON reviews(tenant_id, course_id, user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_is_public ON reviews(is_public);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_reviews_updated_at ON reviews(updated_at DESC);
CREATE INDEX idx_reviews_deleted_at ON reviews(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_reviews_public_deleted ON reviews(tenant_id, course_id, is_public, deleted_at);

-- Course ratings indexes
CREATE INDEX idx_course_ratings_tenant_id ON course_ratings(tenant_id);
CREATE INDEX idx_course_ratings_course_id ON course_ratings(course_id);
CREATE INDEX idx_course_ratings_average_rating ON course_ratings(average_rating DESC);
CREATE INDEX idx_course_ratings_total_reviews ON course_ratings(total_reviews DESC);
CREATE INDEX idx_course_ratings_updated_at ON course_ratings(updated_at DESC);

-- Review helpful indexes
CREATE INDEX idx_review_helpful_tenant_id ON review_helpful(tenant_id);
CREATE INDEX idx_review_helpful_review_id ON review_helpful(review_id);
CREATE INDEX idx_review_helpful_user_id ON review_helpful(user_id);
CREATE INDEX idx_review_helpful_tenant_review ON review_helpful(tenant_id, review_id);
CREATE INDEX idx_review_helpful_is_helpful ON review_helpful(is_helpful);
CREATE INDEX idx_review_helpful_created_at ON review_helpful(created_at DESC);

-- Review reports indexes
CREATE INDEX idx_review_reports_tenant_id ON review_reports(tenant_id);
CREATE INDEX idx_review_reports_review_id ON review_reports(review_id);
CREATE INDEX idx_review_reports_reporter_id ON review_reports(reporter_id);
CREATE INDEX idx_review_reports_status ON review_reports(status);
CREATE INDEX idx_review_reports_tenant_status ON review_reports(tenant_id, status);
CREATE INDEX idx_review_reports_created_at ON review_reports(created_at DESC);
CREATE INDEX idx_review_reports_updated_at ON review_reports(updated_at DESC);

-- Add comments for documentation
COMMENT ON TABLE reviews IS 'Stores course reviews and ratings from students';
COMMENT ON TABLE course_ratings IS 'Stores aggregated rating statistics per course';
COMMENT ON TABLE review_helpful IS 'Stores helpful/unhelpful votes on reviews';
COMMENT ON TABLE review_reports IS 'Stores reports of inappropriate reviews';

COMMENT ON COLUMN reviews.id IS 'Unique review identifier';
COMMENT ON COLUMN reviews.tenant_id IS 'Tenant identifier for multi-tenancy';
COMMENT ON COLUMN reviews.course_id IS 'Course being reviewed';
COMMENT ON COLUMN reviews.user_id IS 'User who wrote the review';
COMMENT ON COLUMN reviews.rating IS 'Star rating from 1 to 5';
COMMENT ON COLUMN reviews.title IS 'Optional review title (max 200 chars)';
COMMENT ON COLUMN reviews.comment IS 'Optional review comment (min 10 chars)';
COMMENT ON COLUMN reviews.is_public IS 'Whether review is visible to other users';
COMMENT ON COLUMN reviews.is_edited IS 'Whether review has been edited after creation';
COMMENT ON COLUMN reviews.created_at IS 'When review was created';
COMMENT ON COLUMN reviews.updated_at IS 'When review was last updated';
COMMENT ON COLUMN reviews.deleted_at IS 'Soft delete timestamp';

COMMENT ON COLUMN course_ratings.course_id IS 'Course being rated';
COMMENT ON COLUMN course_ratings.tenant_id IS 'Tenant identifier for multi-tenancy';
COMMENT ON COLUMN course_ratings.average_rating IS 'Average rating from 0.00 to 5.00';
COMMENT ON COLUMN course_ratings.total_reviews IS 'Total number of public reviews';
COMMENT ON COLUMN course_ratings.rating_5_stars IS 'Count of 5-star reviews';
COMMENT ON COLUMN course_ratings.rating_4_stars IS 'Count of 4-star reviews';
COMMENT ON COLUMN course_ratings.rating_3_stars IS 'Count of 3-star reviews';
COMMENT ON COLUMN course_ratings.rating_2_stars IS 'Count of 2-star reviews';
COMMENT ON COLUMN course_ratings.rating_1_star IS 'Count of 1-star reviews';
COMMENT ON COLUMN course_ratings.updated_at IS 'When ratings were last recalculated';

COMMENT ON COLUMN review_helpful.id IS 'Unique vote identifier';
COMMENT ON COLUMN review_helpful.tenant_id IS 'Tenant identifier for multi-tenancy';
COMMENT ON COLUMN review_helpful.review_id IS 'Review being voted on';
COMMENT ON COLUMN review_helpful.user_id IS 'User who voted';
COMMENT ON COLUMN review_helpful.is_helpful IS 'true = helpful, false = not helpful';
COMMENT ON COLUMN review_helpful.created_at IS 'When vote was created';

COMMENT ON COLUMN review_reports.id IS 'Unique report identifier';
COMMENT ON COLUMN review_reports.tenant_id IS 'Tenant identifier for multi-tenancy';
COMMENT ON COLUMN review_reports.review_id IS 'Review being reported';
COMMENT ON COLUMN review_reports.reporter_id IS 'User who reported the review';
COMMENT ON COLUMN review_reports.reason IS 'Reason for reporting (max 1000 chars)';
COMMENT ON COLUMN review_reports.status IS 'Report status: pending, approved, rejected';
COMMENT ON COLUMN review_reports.created_at IS 'When report was created';
COMMENT ON COLUMN review_reports.updated_at IS 'When report status was last updated';
