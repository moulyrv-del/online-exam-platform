-- Optional starter content. Load with: npm run db:seed

INSERT INTO exams (title, description, duration_minutes) VALUES
('JavaScript Basics', 'Five questions on core JavaScript concepts.', 10),
('General Knowledge', 'Five everyday general knowledge questions.', 10);

INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks) VALUES
((SELECT id FROM exams WHERE title = 'JavaScript Basics'), 'Which keyword declares a constant that cannot be reassigned?', 'var', 'let', 'const', 'static', 'C', 2),
((SELECT id FROM exams WHERE title = 'JavaScript Basics'), 'What does typeof null return?', '"null"', '"undefined"', '"object"', '"number"', 'C', 2),
((SELECT id FROM exams WHERE title = 'JavaScript Basics'), 'Which array method adds an element to the end of an array?', 'push()', 'pop()', 'shift()', 'unshift()', 'A', 2),
((SELECT id FROM exams WHERE title = 'JavaScript Basics'), 'What does the === operator do?', 'Assigns a value', 'Compares value only', 'Compares value and type', 'Compares type only', 'C', 2),
((SELECT id FROM exams WHERE title = 'JavaScript Basics'), 'Which of these is NOT a JavaScript data type?', 'String', 'Boolean', 'Float', 'Symbol', 'C', 2),

((SELECT id FROM exams WHERE title = 'General Knowledge'), 'What is the capital of France?', 'Berlin', 'Madrid', 'Paris', 'Rome', 'C', 2),
((SELECT id FROM exams WHERE title = 'General Knowledge'), 'Which planet is known as the Red Planet?', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'B', 2),
((SELECT id FROM exams WHERE title = 'General Knowledge'), 'Which is the largest ocean on Earth?', 'Atlantic', 'Indian', 'Arctic', 'Pacific', 'D', 2),
((SELECT id FROM exams WHERE title = 'General Knowledge'), 'H2O is the chemical formula for what?', 'Salt', 'Water', 'Oxygen', 'Hydrogen', 'B', 2),
((SELECT id FROM exams WHERE title = 'General Knowledge'), 'How many continents are there?', '5', '6', '7', '8', 'C', 2);
