import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';

const EMPTY_FORM = {
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_option: 'A',
  marks: 1,
};

export default function AdminQuestions() {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function load() {
    try {
      const data = await api('/admin/exams/' + id);
      setExam(data.exam);
      setQuestions(data.questions);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function saveQuestion(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    try {
      if (editingId) {
        await api('/admin/questions/' + editingId, { method: 'PUT', body: form });
        setInfo('Question updated.');
      } else {
        await api('/admin/questions', { method: 'POST', body: { ...form, exam_id: Number(id) } });
        setInfo('Question added.');
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(q) {
    setEditingId(q.id);
    setForm({
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: q.correct_option,
      marks: q.marks,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteQuestion(q) {
    if (!window.confirm('Delete this question?')) return;
    try {
      await api('/admin/questions/' + q.id, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!exam) return <div className="container">{error ? <div className="alert alert-error">{error}</div> : <p>Loading...</p>}</div>;

  return (
    <div className="container">
      <Link to="/admin">&larr; Back to admin dashboard</Link>
      <h1>{exam.title}: questions</h1>
      <p className="muted">Duration: {exam.duration_minutes} minutes &nbsp;|&nbsp; {questions.length} question(s)</p>

      {error && <div className="alert alert-error">{error}</div>}
      {info && <div className="alert alert-ok">{info}</div>}

      <form className="card" onSubmit={saveQuestion}>
        <h3>{editingId ? 'Edit question' : 'Add a question'}</h3>
        <div className="form-group">
          <label htmlFor="question_text">Question</label>
          <textarea id="question_text" name="question_text" rows="3" value={form.question_text} onChange={handleChange} required />
        </div>
        <div className="form-row">
          <div className="form-group grow">
            <label htmlFor="option_a">Option A</label>
            <input id="option_a" name="option_a" value={form.option_a} onChange={handleChange} required />
          </div>
          <div className="form-group grow">
            <label htmlFor="option_b">Option B</label>
            <input id="option_b" name="option_b" value={form.option_b} onChange={handleChange} required />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group grow">
            <label htmlFor="option_c">Option C</label>
            <input id="option_c" name="option_c" value={form.option_c} onChange={handleChange} required />
          </div>
          <div className="form-group grow">
            <label htmlFor="option_d">Option D</label>
            <input id="option_d" name="option_d" value={form.option_d} onChange={handleChange} required />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="correct_option">Correct answer</label>
            <select id="correct_option" name="correct_option" value={form.correct_option} onChange={handleChange}>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="marks">Marks</label>
            <input id="marks" name="marks" type="number" min="1" value={form.marks} onChange={handleChange} required />
          </div>
        </div>
        <div className="button-row">
          <button className="btn btn-primary">{editingId ? 'Save changes' : 'Add question'}</button>
          {editingId && (
            <button type="button" className="btn btn-outline" onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }}>Cancel edit</button>
          )}
        </div>
      </form>

      <h2>Questions in this exam</h2>
      {questions.length === 0 && <p className="muted">No questions yet. Add the first one above.</p>}
      {questions.map((q, index) => (
        <div className="card review-card" key={q.id}>
          <div className="review-head">
            <strong>{index + 1}. {q.question_text}</strong>
            <span className="badge">{q.marks} mark(s)</span>
          </div>
          <ul className="review-options">
            {['A', 'B', 'C', 'D'].map((letter) => (
              <li key={letter} className={q.correct_option === letter ? 'is-correct' : ''}>
                <strong>{letter}.</strong> {q['option_' + letter.toLowerCase()]}
                {q.correct_option === letter && ' (correct answer)'}
              </li>
            ))}
          </ul>
          <div className="button-row">
            <button className="btn btn-small btn-outline" onClick={() => startEdit(q)}>Edit</button>
            <button className="btn btn-small btn-danger" onClick={() => deleteQuestion(q)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
