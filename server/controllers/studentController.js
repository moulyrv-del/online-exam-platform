const pool = require('../db/pool');

// GET /api/exams - all exams with their question count
exports.listExams = async (req, res) => {
  const result = await pool.query(`
    SELECT e.id, e.title, e.description, e.duration_minutes,
           (SELECT COUNT(*) FROM questions q WHERE q.exam_id = e.id)::int AS question_count
    FROM exams e
    ORDER BY e.id
  `);
  res.json(result.rows);
};

// POST /api/exams/:id/start - creates (or resumes) an attempt and returns the questions
// The correct answers are NOT sent to the browser.
exports.startExam = async (req, res) => {
  const examId = Number(req.params.id);
  const userId = req.user.id;

  const examResult = await pool.query('SELECT * FROM exams WHERE id = $1', [examId]);
  const exam = examResult.rows[0];
  if (!exam) return res.status(404).json({ message: 'Exam not found' });

  const questions = await pool.query(
    'SELECT id, question_text, option_a, option_b, option_c, option_d, marks FROM questions WHERE exam_id = $1 ORDER BY id',
    [examId]
  );
  if (questions.rows.length === 0) {
    return res.status(400).json({ message: 'This exam has no questions yet' });
  }

  // Resume an unfinished attempt (e.g. after a page refresh) or create a new one
  const existing = await pool.query(
    "SELECT * FROM exam_attempts WHERE user_id = $1 AND exam_id = $2 AND status = 'in_progress' ORDER BY id DESC LIMIT 1",
    [userId, examId]
  );
  let attempt = existing.rows[0];
  if (!attempt) {
    const created = await pool.query(
      'INSERT INTO exam_attempts (user_id, exam_id) VALUES ($1, $2) RETURNING *',
      [userId, examId]
    );
    attempt = created.rows[0];
  }

  // The server decides how much time is left, so refreshing the page cannot reset the clock
  const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000);
  const remainingSeconds = Math.max(0, exam.duration_minutes * 60 - elapsedSeconds);

  // Answers already saved for this attempt (used when the page is refreshed)
  const saved = await pool.query('SELECT question_id, selected_option FROM answers WHERE attempt_id = $1', [attempt.id]);
  const savedAnswers = {};
  saved.rows.forEach((row) => {
    if (row.selected_option) savedAnswers[row.question_id] = row.selected_option;
  });

  res.json({
    savedAnswers,
    attemptId: attempt.id,
    warningCount: attempt.warning_count,
    remainingSeconds,
    exam: { id: exam.id, title: exam.title, duration_minutes: exam.duration_minutes },
    questions: questions.rows,
  });
};

// POST /api/attempts/:id/warning - called when the student leaves the exam tab/window
exports.addWarning = async (req, res) => {
  const result = await pool.query(
    "UPDATE exam_attempts SET warning_count = warning_count + 1 WHERE id = $1 AND user_id = $2 AND status = 'in_progress' RETURNING warning_count",
    [req.params.id, req.user.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ message: 'Active attempt not found' });
  res.json({ warningCount: result.rows[0].warning_count });
};

// PUT /api/attempts/:id/answer - saves one answer as soon as the student picks it
// body: { questionId, selected }   (selected = "A".."D", or null to clear)
exports.saveAnswer = async (req, res) => {
  const attemptId = Number(req.params.id);
  const { questionId, selected } = req.body;

  const found = await pool.query(
    `SELECT ea.*, e.duration_minutes FROM exam_attempts ea
     JOIN exams e ON e.id = ea.exam_id
     WHERE ea.id = $1 AND ea.user_id = $2`,
    [attemptId, req.user.id]
  );
  const attempt = found.rows[0];
  if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
  if (attempt.status === 'submitted') return res.status(400).json({ message: 'Exam already submitted' });

  const elapsed = (Date.now() - new Date(attempt.started_at).getTime()) / 1000;
  if (elapsed > attempt.duration_minutes * 60 + 10) {
    return res.status(400).json({ message: 'Time is over' });
  }

  const q = await pool.query('SELECT id FROM questions WHERE id = $1 AND exam_id = $2', [questionId, attempt.exam_id]);
  if (q.rows.length === 0) return res.status(400).json({ message: 'Invalid question' });

  if (!selected) {
    await pool.query('DELETE FROM answers WHERE attempt_id = $1 AND question_id = $2', [attemptId, questionId]);
  } else {
    if (!['A', 'B', 'C', 'D'].includes(selected)) return res.status(400).json({ message: 'Invalid option' });
    await pool.query(
      `INSERT INTO answers (attempt_id, question_id, selected_option, is_correct)
       VALUES ($1, $2, $3, FALSE)
       ON CONFLICT (attempt_id, question_id) DO UPDATE SET selected_option = EXCLUDED.selected_option`,
      [attemptId, questionId, selected]
    );
  }
  res.json({ ok: true });
};

// POST /api/attempts/:id/submit - body: { answers: { "<questionId>": "A" } }
// Automatic evaluation happens here.
exports.submitAttempt = async (req, res) => {
  const attemptId = Number(req.params.id);
  const sent = req.body.answers || {};

  const attemptResult = await pool.query(
    'SELECT * FROM exam_attempts WHERE id = $1 AND user_id = $2',
    [attemptId, req.user.id]
  );
  const attempt = attemptResult.rows[0];
  if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
  if (attempt.status === 'submitted') return res.json({ attemptId }); // already done

  const questions = await pool.query('SELECT * FROM questions WHERE exam_id = $1', [attempt.exam_id]);

  // Answers already saved on the server, overlaid with the final list from the browser
  const savedRows = await pool.query('SELECT question_id, selected_option FROM answers WHERE attempt_id = $1', [attemptId]);
  const submitted = {};
  savedRows.rows.forEach((row) => { if (row.selected_option) submitted[row.question_id] = row.selected_option; });
  Object.assign(submitted, sent);

  let correct = 0;
  let incorrect = 0;
  let totalMarks = 0;
  let obtainedMarks = 0;
  const rows = [];

  for (const q of questions.rows) {
    const picked = String(submitted[q.id] || '').toUpperCase();
    const selected = ['A', 'B', 'C', 'D'].includes(picked) ? picked : null;
    const isCorrect = selected === q.correct_option;

    totalMarks += q.marks;
    if (selected === null) {
      // unanswered: no marks, not counted as incorrect
    } else if (isCorrect) {
      correct += 1;
      obtainedMarks += q.marks;
    } else {
      incorrect += 1;
    }
    rows.push({ questionId: q.id, selected, isCorrect });
  }

  const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 10000) / 100 : 0;

  // Save everything together: either all of it is saved or none of it
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const r of rows) {
      await client.query(
        `INSERT INTO answers (attempt_id, question_id, selected_option, is_correct) VALUES ($1, $2, $3, $4)
         ON CONFLICT (attempt_id, question_id) DO UPDATE SET selected_option = EXCLUDED.selected_option, is_correct = EXCLUDED.is_correct`,
        [attemptId, r.questionId, r.selected, r.isCorrect]
      );
    }
    await client.query(
      `INSERT INTO results (attempt_id, user_id, exam_id, total_questions, correct_count, incorrect_count, total_marks, obtained_marks, percentage)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [attemptId, req.user.id, attempt.exam_id, questions.rows.length, correct, incorrect, totalMarks, obtainedMarks, percentage]
    );
    await client.query(
      "UPDATE exam_attempts SET status = 'submitted', submitted_at = NOW() WHERE id = $1",
      [attemptId]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  res.json({ attemptId });
};

// GET /api/results - the logged-in student's previous results
exports.myResults = async (req, res) => {
  const result = await pool.query(
    `SELECT r.*, e.title AS exam_title, ea.warning_count, ea.submitted_at
     FROM results r
     JOIN exams e ON e.id = r.exam_id
     JOIN exam_attempts ea ON ea.id = r.attempt_id
     WHERE r.user_id = $1
     ORDER BY r.id DESC`,
    [req.user.id]
  );
  res.json(result.rows);
};

// GET /api/results/:attemptId - one result with question-by-question review
// Students can only open their own result; admins can open any.
exports.resultDetail = async (req, res) => {
  const attemptId = Number(req.params.attemptId);

  const summary = await pool.query(
    `SELECT r.*, e.title AS exam_title, u.name AS student_name, ea.warning_count, ea.submitted_at
     FROM results r
     JOIN exams e ON e.id = r.exam_id
     JOIN users u ON u.id = r.user_id
     JOIN exam_attempts ea ON ea.id = r.attempt_id
     WHERE r.attempt_id = $1`,
    [attemptId]
  );
  const result = summary.rows[0];
  if (!result) return res.status(404).json({ message: 'Result not found' });
  if (req.user.role !== 'admin' && result.user_id !== req.user.id) {
    return res.status(403).json({ message: 'You cannot view this result' });
  }

  result.unanswered_count = result.total_questions - result.correct_count - result.incorrect_count;

  const review = await pool.query(
    `SELECT q.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d,
            q.correct_option, q.marks, a.selected_option, a.is_correct
     FROM questions q
     LEFT JOIN answers a ON a.question_id = q.id AND a.attempt_id = $1
     WHERE q.exam_id = $2
     ORDER BY q.id`,
    [attemptId, result.exam_id]
  );

  res.json({ result, review: review.rows });
};
