const pool = require('../db/pool');

// ---------- Exams ----------
function checkExam(b) {
  if (!b.title || !String(b.title).trim()) return 'Exam title is required';
  const d = Number(b.duration_minutes);
  if (!Number.isInteger(d) || d < 1 || d > 600) return 'Duration must be a whole number between 1 and 600 minutes';
  return null;
}

exports.listExams = async (req, res) => {
  const result = await pool.query(`
    SELECT e.*,
           (SELECT COUNT(*) FROM questions q WHERE q.exam_id = e.id)::int AS question_count,
           (SELECT COUNT(*) FROM results r WHERE r.exam_id = e.id)::int AS attempt_count
    FROM exams e
    ORDER BY e.id
  `);
  res.json(result.rows);
};

exports.createExam = async (req, res) => {
  const error = checkExam(req.body);
  if (error) return res.status(400).json({ message: error });
  const { title, description, duration_minutes } = req.body;
  const result = await pool.query(
    'INSERT INTO exams (title, description, duration_minutes) VALUES ($1, $2, $3) RETURNING *',
    [title.trim(), (description || '').trim(), Number(duration_minutes)]
  );
  res.status(201).json(result.rows[0]);
};

exports.updateExam = async (req, res) => {
  const error = checkExam(req.body);
  if (error) return res.status(400).json({ message: error });
  const { title, description, duration_minutes } = req.body;
  const result = await pool.query(
    'UPDATE exams SET title = $1, description = $2, duration_minutes = $3 WHERE id = $4 RETURNING *',
    [title.trim(), (description || '').trim(), Number(duration_minutes), req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ message: 'Exam not found' });
  res.json(result.rows[0]);
};

exports.deleteExam = async (req, res) => {
  await pool.query('DELETE FROM exams WHERE id = $1', [req.params.id]);
  res.json({ message: 'Exam deleted' });
};

// One exam with all its questions (including correct answers - admin only)
exports.getExam = async (req, res) => {
  const exam = await pool.query('SELECT * FROM exams WHERE id = $1', [req.params.id]);
  if (exam.rows.length === 0) return res.status(404).json({ message: 'Exam not found' });
  const questions = await pool.query('SELECT * FROM questions WHERE exam_id = $1 ORDER BY id', [req.params.id]);
  res.json({ exam: exam.rows[0], questions: questions.rows });
};

// ---------- Questions ----------
function checkQuestion(b) {
  const fields = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d'];
  for (const f of fields) {
    if (!b[f] || !String(b[f]).trim()) return 'Please fill in the question and all four options';
  }
  if (!['A', 'B', 'C', 'D'].includes(b.correct_option)) return 'Correct answer must be A, B, C or D';
  const marks = Number(b.marks);
  if (!Number.isInteger(marks) || marks < 1) return 'Marks must be a whole number of 1 or more';
  return null;
}

exports.createQuestion = async (req, res) => {
  const error = checkQuestion(req.body);
  if (error) return res.status(400).json({ message: error });
  const b = req.body;

  const exam = await pool.query('SELECT id FROM exams WHERE id = $1', [b.exam_id]);
  if (exam.rows.length === 0) return res.status(404).json({ message: 'Exam not found' });

  const result = await pool.query(
    `INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [b.exam_id, b.question_text.trim(), b.option_a.trim(), b.option_b.trim(), b.option_c.trim(), b.option_d.trim(), b.correct_option, Number(b.marks)]
  );
  res.status(201).json(result.rows[0]);
};

exports.updateQuestion = async (req, res) => {
  const error = checkQuestion(req.body);
  if (error) return res.status(400).json({ message: error });
  const b = req.body;
  const result = await pool.query(
    `UPDATE questions SET question_text = $1, option_a = $2, option_b = $3, option_c = $4, option_d = $5,
            correct_option = $6, marks = $7
     WHERE id = $8 RETURNING *`,
    [b.question_text.trim(), b.option_a.trim(), b.option_b.trim(), b.option_c.trim(), b.option_d.trim(), b.correct_option, Number(b.marks), req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ message: 'Question not found' });
  res.json(result.rows[0]);
};

exports.deleteQuestion = async (req, res) => {
  await pool.query('DELETE FROM questions WHERE id = $1', [req.params.id]);
  res.json({ message: 'Question deleted' });
};

// ---------- Results ----------
exports.allResults = async (req, res) => {
  const result = await pool.query(`
    SELECT r.*, u.name AS student_name, u.email AS student_email,
           e.title AS exam_title, ea.warning_count, ea.submitted_at
    FROM results r
    JOIN users u ON u.id = r.user_id
    JOIN exams e ON e.id = r.exam_id
    JOIN exam_attempts ea ON ea.id = r.attempt_id
    ORDER BY r.id DESC
  `);
  res.json(result.rows);
};
