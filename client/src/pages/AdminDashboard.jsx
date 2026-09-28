import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

const EMPTY_FORM = { title: '', description: '', duration_minutes: 30 };

export default function AdminDashboard() {
  const [tab, setTab] = useState('exams');
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function loadAll() {
    try {
      const [examData, resultData] = await Promise.all([api('/admin/exams'), api('/admin/results')]);
      setExams(examData);
      setResults(resultData);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function saveExam(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    try {
      if (editingId) {
        await api('/admin/exams/' + editingId, { method: 'PUT', body: form });
        setInfo('Exam updated.');
      } else {
        await api('/admin/exams', { method: 'POST', body: form });
        setInfo('Exam created. Click "Questions" to add questions to it.');
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(exam) {
    setEditingId(exam.id);
    setForm({ title: exam.title, description: exam.description || '', duration_minutes: exam.duration_minutes });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteExam(exam) {
    if (!window.confirm('Delete "' + exam.title + '" with all its questions and results?')) return;
    try {
      await api('/admin/exams/' + exam.id, { method: 'DELETE' });
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="container">
      <h1>Admin dashboard</h1>

      <div className="tabs">
        <button className={tab === 'exams' ? 'tab active' : 'tab'} onClick={() => setTab('exams')}>Exams ({exams.length})</button>
        <button className={tab === 'results' ? 'tab active' : 'tab'} onClick={() => setTab('results')}>Student results ({results.length})</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {info && <div className="alert alert-ok">{info}</div>}

      {tab === 'exams' && (
        <>
          <form className="card" onSubmit={saveExam}>
            <h3>{editingId ? 'Edit exam' : 'Create a new exam'}</h3>
            <div className="form-row">
              <div className="form-group grow">
                <label htmlFor="title">Exam title</label>
                <input id="title" name="title" value={form.title} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="duration_minutes">Duration (minutes)</label>
                <input id="duration_minutes" name="duration_minutes" type="number" min="1" max="600" value={form.duration_minutes} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="description">Description (optional)</label>
              <input id="description" name="description" value={form.description} onChange={handleChange} />
            </div>
            <div className="button-row">
              <button className="btn btn-primary">{editingId ? 'Save changes' : 'Create exam'}</button>
              {editingId && (
                <button type="button" className="btn btn-outline" onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }}>Cancel edit</button>
              )}
            </div>
          </form>

          <h2>All exams</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Title</th><th>Duration</th><th>Questions</th><th>Attempts</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.id}>
                    <td>{exam.title}</td>
                    <td>{exam.duration_minutes} min</td>
                    <td>{exam.question_count}</td>
                    <td>{exam.attempt_count}</td>
                    <td className="actions">
                      <Link className="btn btn-small btn-outline" to={'/admin/exams/' + exam.id}>Questions</Link>
                      <button className="btn btn-small btn-outline" onClick={() => startEdit(exam)}>Edit</button>
                      <button className="btn btn-small btn-danger" onClick={() => deleteExam(exam)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'results' && (
        <div className="table-wrap">
          {results.length === 0 ? (
            <p className="muted">No student has submitted an exam yet.</p>
          ) : (
            <table>
              <thead>
                <tr><th>Student</th><th>Exam</th><th>Marks</th><th>Percentage</th><th>Warnings</th><th>Date</th><th></th></tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id}>
                    <td>{r.student_name}<br /><small className="muted">{r.student_email}</small></td>
                    <td>{r.exam_title}</td>
                    <td>{r.obtained_marks} / {r.total_marks}</td>
                    <td>{Number(r.percentage).toFixed(1)}%</td>
                    <td><span className={'badge ' + (r.warning_count > 0 ? 'badge-warn' : 'badge-ok')}>{r.warning_count}</span></td>
                    <td>{new Date(r.submitted_at).toLocaleString()}</td>
                    <td><Link to={'/result/' + r.attempt_id}>Details</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
