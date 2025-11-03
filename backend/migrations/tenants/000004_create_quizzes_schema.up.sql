-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    passing_score INTEGER NOT NULL DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),
    time_limit INTEGER CHECK (time_limit IS NULL OR time_limit > 0),
    max_attempts INTEGER CHECK (max_attempts IS NULL OR max_attempts > 0),
    shuffle_questions BOOLEAN DEFAULT false,
    shuffle_options BOOLEAN DEFAULT false,
    show_results BOOLEAN DEFAULT true,
    show_correct_answers BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'short_answer', 'essay')),
    text TEXT NOT NULL CHECK (LENGTH(text) >= 3 AND LENGTH(text) <= 1000),
    points INTEGER NOT NULL DEFAULT 1 CHECK (points >= 0),
    explanation TEXT CHECK (explanation IS NULL OR LENGTH(explanation) <= 500),
    order_index INTEGER NOT NULL DEFAULT 0 CHECK (order_index >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT questions_quiz_order_unique UNIQUE (tenant_id, quiz_id, order_index)
);

-- Create question_options table
CREATE TABLE IF NOT EXISTS question_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    text VARCHAR(500) NOT NULL CHECK (LENGTH(text) >= 1),
    is_correct BOOLEAN DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0 CHECK (order_index >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT options_question_order_unique UNIQUE (tenant_id, question_id, order_index)
);

-- Create quiz_attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
    is_passed BOOLEAN,
    time_spent INTEGER CHECK (time_spent IS NULL OR time_spent >= 0),
    attempt_number INTEGER NOT NULL CHECK (attempt_number >= 1),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT quiz_attempts_user_quiz_number_unique UNIQUE (tenant_id, quiz_id, user_id, attempt_number)
);

-- Create quiz_answers table
CREATE TABLE IF NOT EXISTS quiz_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer_text TEXT,
    selected_option_id UUID REFERENCES question_options(id) ON DELETE SET NULL,
    is_correct BOOLEAN,
    points_awarded INTEGER NOT NULL DEFAULT 0 CHECK (points_awarded >= 0),
    instructor_feedback TEXT CHECK (instructor_feedback IS NULL OR LENGTH(instructor_feedback) <= 1000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT quiz_answers_attempt_question_unique UNIQUE (tenant_id, attempt_id, question_id)
);

-- Create indexes for performance
-- Quizzes indexes
CREATE INDEX idx_quizzes_tenant_id ON quizzes(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_quizzes_course_id ON quizzes(course_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_quizzes_lesson_id ON quizzes(lesson_id) WHERE lesson_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_quizzes_is_published ON quizzes(is_published) WHERE deleted_at IS NULL;
CREATE INDEX idx_quizzes_created_at ON quizzes(created_at DESC) WHERE deleted_at IS NULL;

-- Questions indexes
CREATE INDEX idx_questions_tenant_id ON questions(tenant_id);
CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX idx_questions_type ON questions(type);
CREATE INDEX idx_questions_order_index ON questions(quiz_id, order_index);

-- Question options indexes
CREATE INDEX idx_question_options_tenant_id ON question_options(tenant_id);
CREATE INDEX idx_question_options_question_id ON question_options(question_id);
CREATE INDEX idx_question_options_is_correct ON question_options(question_id, is_correct);
CREATE INDEX idx_question_options_order_index ON question_options(question_id, order_index);

-- Quiz attempts indexes
CREATE INDEX idx_quiz_attempts_tenant_id ON quiz_attempts(tenant_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_user_quiz ON quiz_attempts(user_id, quiz_id);
CREATE INDEX idx_quiz_attempts_completed_at ON quiz_attempts(completed_at);
CREATE INDEX idx_quiz_attempts_started_at ON quiz_attempts(started_at DESC);
CREATE INDEX idx_quiz_attempts_attempt_number ON quiz_attempts(quiz_id, user_id, attempt_number);

-- Quiz answers indexes
CREATE INDEX idx_quiz_answers_tenant_id ON quiz_answers(tenant_id);
CREATE INDEX idx_quiz_answers_attempt_id ON quiz_answers(attempt_id);
CREATE INDEX idx_quiz_answers_question_id ON quiz_answers(question_id);
CREATE INDEX idx_quiz_answers_is_correct ON quiz_answers(is_correct) WHERE is_correct IS NULL;
CREATE INDEX idx_quiz_answers_selected_option_id ON quiz_answers(selected_option_id) WHERE selected_option_id IS NOT NULL;
