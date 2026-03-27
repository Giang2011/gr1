-- Tạo database (Nếu chưa có)
CREATE DATABASE IF NOT EXISTS online_exam_db;
USE online_exam_db;

-- 1. Bảng users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('STUDENT', 'ADMIN') DEFAULT 'STUDENT'
);

-- 2. Bảng subjects
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL -- VD: Toán, Lý, Hóa
);

-- 3. Bảng questions
CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    subject_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- 4. Bảng answers
CREATE TABLE answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    content TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- 5. Bảng exams
CREATE TABLE exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL, -- VD: "Thi giữa kỳ Toán"
    subject_id INT NOT NULL,
    duration INT NOT NULL COMMENT 'Thời gian làm bài tính bằng phút',
    total_questions INT NOT NULL COMMENT 'Số câu hỏi cần lấy',
    start_time DATETIME,
    end_time DATETIME,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- 6. Bảng exam_participants
CREATE TABLE exam_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    user_id INT NOT NULL,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Bảng exam_sessions
CREATE TABLE exam_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    user_id INT NOT NULL,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    status ENUM('DOING', 'SUBMITTED') DEFAULT 'DOING',
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. Bảng exam_questions
CREATE TABLE exam_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_session_id INT NOT NULL,
    question_id INT NOT NULL,
    order_index INT NOT NULL COMMENT 'Thứ tự câu hỏi trong đề',
    FOREIGN KEY (exam_session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- 9. Bảng exam_answers
CREATE TABLE exam_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_question_id INT NOT NULL,
    answer_id INT NOT NULL,
    order_index INT NOT NULL COMMENT 'Thứ tự đáp án (để xáo trộn)',
    FOREIGN KEY (exam_question_id) REFERENCES exam_questions(id) ON DELETE CASCADE,
    FOREIGN KEY (answer_id) REFERENCES answers(id) ON DELETE CASCADE
);

-- 10. Bảng user_answers
CREATE TABLE user_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_question_id INT NOT NULL,
    FOREIGN KEY (exam_question_id) REFERENCES exam_questions(id) ON DELETE CASCADE
);

CREATE TABLE user_answer_selections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_answer_id INT NOT NULL,
    selected_answer_id INT NOT NULL,
    UNIQUE KEY uk_user_answer_selection (user_answer_id, selected_answer_id),
    FOREIGN KEY (user_answer_id) REFERENCES user_answers(id) ON DELETE CASCADE,
    FOREIGN KEY (selected_answer_id) REFERENCES answers(id) ON DELETE CASCADE
);

-- 11. Bảng results
CREATE TABLE results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_session_id INT NOT NULL UNIQUE,
    score FLOAT DEFAULT 0.0,
    total_correct INT DEFAULT 0,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE
);