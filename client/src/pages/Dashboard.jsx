import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api('/exams'), api('/results')])
      .then(([examData, resultData]) => {
        setExams(examData);
        setResults(resultData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container"><p>Loading exams...</p></div>;

  return (
    <div className="container">
      <h1>Hello, {user.name}</h1>
      <p className="muted">Pick an exam below. Your webcam will be switched on once you start.</p>

      {error && <div className="alert alert-error">{error}</div>}

      <h2>Available exams</h2>
      {exams.length === 0 && <p className="muted">No exams have been created yet.</p>}
      <div className="grid">
        {exams.map((exam) => (
          <div className="card exam-card" key={exam.id}>
            <h3>{exam.title}</h3>
            <p className="muted">{exam.description}</p>
            <ul className="exam-meta">
              <li>Duration: <strong>{exam.duration_minutes} min</strong></li>
              <li>Questions: <strong>{exam.question_count}</strong></li>
            </ul>
            <button
              className="btn btn-primary btn-block"
              disabled={exam.question_count === 0}
              onClick={() => navigate('/exam/' + exam.id)}
            >
              {exam.question_count === 0 ? 'No questions yet' : 'Start exam'}
            </button>
          </div>
        ))}
      </div>

      <h2>Your previous results</h2>
      {results.length === 0 ? (
        <p className="muted">You have not taken any exam yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Exam</th><th>Marks</th><th>Percentage</th><th>Warnings</th><th>Date</th><th></th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id}>
                  <td>{r.exam_title}</td>
                  <td>{r.obtained_marks} / {r.total_marks}</td>
                  <td>{Number(r.percentage).toFixed(1)}%</td>
                  <td>{r.warning_count}</td>
                  <td>{new Date(r.submitted_at).toLocaleString()}</td>
                  <td><Link to={'/result/' + r.attempt_id}>View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
