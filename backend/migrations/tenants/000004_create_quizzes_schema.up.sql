-- Extend Quizzes Schema
-- Adds extended fields to existing quizzes table and creates related tables
-- Note: Base quizzes table is created in migration 000001

-- Add extended quiz fields (quizzes table already exists from 000001 with basic structure)
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS time_limit INTEGER CHECK (time_limit IS NULL OR time_limit > 0);
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN DEFAULT false;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS shuffle_options BOOLEAN DEFAULT false;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS show_results BOOLEAN DEFAULT true;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS show_correct_answers BOOLEAN DEFAULT true;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Update existing columns if needed
-- Note: Migration 000001 creates quizzes.passing_score as INTEGER DEFAULT 70
-- This migration adds the constraint to ensure it's in range
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quizzes_passing_score_check') THEN
        ALTER TABLE quizzes ADD CONSTRAINT quizzes_passing_score_check CHECK (passing_score >= 0 AND passing_score <= 100);
    END IF;
END $$;

-- Extend quiz_questions table (already exists from 000001 as quiz_questions)
-- Note: 000001 creates this as 'quiz_questions', this migration extends it
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS type VARCHAR(20) CHECK (type IN ('multiple_choice', 'true_false', 'short_answer', 'essay'));
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS explanation TEXT CHECK (explanation IS NULL OR LENGTH(explanation) <= 500);
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add constraints for quiz questions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quiz_questions_text_length') THEN
        ALTER TABLE quiz_questions ADD CONSTRAINT quiz_questions_text_length CHECK (LENGTH(question_text) >= 3 AND LENGTH(question_text) <= 1000);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'questions_quiz_order_unique') THEN
        ALTER TABLE quiz_questions ADD CONSTRAINT questions_quiz_order_unique UNIQUE (tenant_id, quiz_id, order_index);
    END IF;
END $$;

-- Rename quiz_answers to question_options if needed, or just extend it
-- Note: 000001 creates 'quiz_answers' table, this migration will work with that structure
ALTER TABLE quiz_answers ADD COLUMN IF NOT EXISTS text VARCHAR(500);
ALTER TABLE quiz_answers ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0 CHECK (order_index >= 0);
ALTER TABLE quiz_answers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add constraints for quiz answers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quiz_answers_text_length') THEN
        ALTER TABLE quiz_answers ADD CONSTRAINT quiz_answers_text_length CHECK (text IS NULL OR LENGTH(text) >= 1);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'options_question_order_unique') THEN
        ALTER TABLE quiz_answers ADD CONSTRAINT options_question_order_unique UNIQUE (tenant_id, question_id, order_index);
    END IF;
END $$;

-- Extend quiz_attempts table (already exists from 000001)
-- Note: 000001 creates basic quiz_attempts, this migration extends it
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS is_passed BOOLEAN;
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS time_spent INTEGER CHECK (time_spent IS NULL OR time_spent >= 0);
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1 CHECK (attempt_number >= 1);
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Update quiz_attempts constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quiz_attempts_score_check') THEN
        ALTER TABLE quiz_attempts ADD CONSTRAINT quiz_attempts_score_check CHECK (score IS NULL OR (score >= 0 AND score <= 100));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quiz_attempts_user_quiz_number_unique') THEN
        ALTER TABLE quiz_attempts ADD CONSTRAINT quiz_attempts_user_quiz_number_unique UNIQUE (tenant_id, quiz_id, user_id, attempt_number);
    END IF;
END $$;

-- Create student_answers table (stores student responses to quiz questions)
-- Note: This is different from quiz_answers in 000001 which stores answer OPTIONS
CREATE TABLE IF NOT EXISTS student_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    answer_text TEXT,
    selected_option_id UUID REFERENCES quiz_answers(id) ON DELETE SET NULL,
    is_correct BOOLEAN,
    points_awarded INTEGER NOT NULL DEFAULT 0 CHECK (points_awarded >= 0),
    instructor_feedback TEXT CHECK (instructor_feedback IS NULL OR LENGTH(instructor_feedback) <= 1000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT student_answers_attempt_question_unique UNIQUE (tenant_id, attempt_id, question_id)
);

-- Create indexes for performance
-- Quizzes indexes
CREATE INDEX IF NOT EXISTS idx_quizzes_tenant_id ON quizzes(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_quizzes_course_id ON quizzes(course_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_id ON quizzes(lesson_id) WHERE lesson_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_quizzes_is_published ON quizzes(is_published) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON quizzes(created_at DESC) WHERE deleted_at IS NULL;

-- Quiz questions indexes (basic indexes already exist from 000001)
CREATE INDEX IF NOT EXISTS idx_quiz_questions_type ON quiz_questions(type);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_order_index ON quiz_questions(quiz_id, order_index);

-- Quiz answers (answer options) indexes (basic indexes already exist from 000001)
CREATE INDEX IF NOT EXISTS idx_quiz_answers_is_correct ON quiz_answers(question_id, is_correct);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_order_index ON quiz_answers(question_id, order_index);

-- Quiz attempts indexes
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_tenant_id ON quiz_attempts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz ON quiz_attempts(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed_at ON quiz_attempts(completed_at);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_started_at ON quiz_attempts(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_attempt_number ON quiz_attempts(quiz_id, user_id, attempt_number);

-- Student answers indexes
CREATE INDEX IF NOT EXISTS idx_student_answers_tenant_id ON student_answers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_attempt_id ON student_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_question_id ON student_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_is_correct ON student_answers(is_correct) WHERE is_correct IS NULL;
CREATE INDEX IF NOT EXISTS idx_student_answers_selected_option_id ON student_answers(selected_option_id) WHERE selected_option_id IS NOT NULL;
