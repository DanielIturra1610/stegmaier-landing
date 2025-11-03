-- Drop quiz_answers table first (depends on quiz_attempts, questions, question_options)
DROP TABLE IF EXISTS quiz_answers CASCADE;

-- Drop quiz_attempts table (depends on quizzes, users)
DROP TABLE IF EXISTS quiz_attempts CASCADE;

-- Drop question_options table (depends on questions)
DROP TABLE IF EXISTS question_options CASCADE;

-- Drop questions table (depends on quizzes)
DROP TABLE IF EXISTS questions CASCADE;

-- Drop quizzes table last (depends on courses, lessons)
DROP TABLE IF EXISTS quizzes CASCADE;
