-- Esquema para guardar examenes/quiz realizados.
-- Por defecto usa la BD `germancito`. Si usas otra, cambia el nombre abajo.

CREATE DATABASE IF NOT EXISTS `germancito`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `germancito`;

CREATE TABLE IF NOT EXISTS quizzes (
  id_quiz INT NOT NULL AUTO_INCREMENT,
  slug VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_quiz),
  UNIQUE KEY uq_quizzes_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS quiz_questions (
  id_question INT NOT NULL AUTO_INCREMENT,
  id_quiz INT NOT NULL,
  question_order INT NOT NULL,
  prompt TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_question),
  UNIQUE KEY uq_quiz_order (id_quiz, question_order),
  INDEX idx_quiz_questions_quiz (id_quiz),
  CONSTRAINT fk_quiz_questions_quiz FOREIGN KEY (id_quiz)
    REFERENCES quizzes (id_quiz) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS quiz_options (
  id_option INT NOT NULL AUTO_INCREMENT,
  id_question INT NOT NULL,
  option_key CHAR(1) NOT NULL,
  option_text TEXT NOT NULL,
  is_correct TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id_option),
  UNIQUE KEY uq_question_key (id_question, option_key),
  INDEX idx_quiz_options_question (id_question),
  CONSTRAINT fk_quiz_options_question FOREIGN KEY (id_question)
    REFERENCES quiz_questions (id_question) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS quiz_results (
  id_result INT NOT NULL AUTO_INCREMENT,
  id_quiz INT NOT NULL,
  exam_date DATE NOT NULL,
  score_10 DECIMAL(4, 1) NOT NULL,
  correct_count INT NOT NULL DEFAULT 0,
  incorrect_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_result),
  INDEX idx_results_quiz_time (id_quiz, created_at),
  CONSTRAINT fk_quiz_results_quiz FOREIGN KEY (id_quiz)
    REFERENCES quizzes (id_quiz) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS quiz_summaries (
  id_quiz INT NOT NULL,
  html LONGTEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_quiz),
  CONSTRAINT fk_quiz_summaries_quiz FOREIGN KEY (id_quiz)
    REFERENCES quizzes (id_quiz) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
