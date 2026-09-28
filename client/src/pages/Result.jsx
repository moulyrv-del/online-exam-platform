import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';

export default function Result() {
  const { attemptId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/results/' + attemptId).then(setData).catch((err) => setError(err.message));
  }, [attemptId]);

  if (error) return <div className="container"><div className="alert alert-error">{error}</div></div>;
  if (!data) return <div className="container"><p>Loading result...</p></div>;

  const { result: r, review } = data;
  const total = r.total_questions || 1;
  const correctEnd = (r.correct_count / total) * 100;
  const incorrectEnd = correctEnd + (r.incorrect_count / total) * 100;
  const chartStyle = {
    background: `conic-gradient(var(--good) 0% ${correctEnd}%, var(--bad) ${correctEnd}% ${incorrectEnd}%, var(--grey) ${incorrectEnd}% 100%)`,
  };

  return (
    <div className="container">
      <h1>{r.exam_title}: result</h1>
      <p className="muted">
        Student: <strong>{r.student_name}</strong> &nbsp;|&nbsp; Taken on {new Date(r.submitted_at).toLocaleString()}
      </p>

      <div className="result-top">
        <div className="card chart-card">
          <div className="donut" style={chartStyle}>
            <div className="donut-hole">{Number(r.percentage).toFixed(1)}%</div>
          </div>
          <ul className="chart-legend">
            <li><span className="dot good"></span> Correct: {r.correct_count}</li>
            <li><span className="dot bad"></span> Incorrect: {r.incorrect_count}</li>
            <li><span className="dot grey"></span> Unanswered: {r.unanswered_count}</li>
          </ul>
        </div>

        <div className="stats">
          <div className="card stat"><span>Total questions</span><strong>{r.total_questions}</strong></div>
          <div className="card stat"><span>Correct answers</span><strong>{r.correct_count}</strong></div>
          <div className="card stat"><span>Incorrect answers</span><strong>{r.incorrect_count}</strong></div>
          <div className="card stat"><span>Total marks</span><strong>{r.total_marks}</strong></div>
          <div className="card stat"><span>Obtained marks</span><strong>{r.obtained_marks}</strong></div>
          <div className="card stat"><span>Percentage</span><strong>{Number(r.percentage).toFixed(2)}%</strong></div>
          <div className="card stat"><span>Proctoring warnings</span><strong>{r.warning_count}</strong></div>
        </div>
      </div>

      <h2>Answer review</h2>
      {review.map((q, index) => {
        let status = 'Not answered';
        let cls = 'review-none';
        if (q.selected_option) {
          status = q.is_correct ? 'Correct' : 'Incorrect';
          cls = q.is_correct ? 'review-good' : 'review-bad';
        }
        return (
          <div className={'card review-card ' + cls} key={q.id}>
            <div className="review-head">
              <strong>{index + 1}. {q.question_text}</strong>
              <span className="badge">{status}</span>
            </div>
            <ul className="review-options">
              {['A', 'B', 'C', 'D'].map((letter) => {
                const isCorrect = q.correct_option === letter;
                const isPicked = q.selected_option === letter;
                return (
                  <li key={letter} className={(isCorrect ? 'is-correct ' : '') + (isPicked && !isCorrect ? 'is-wrong' : '')}>
                    <strong>{letter}.</strong> {q['option_' + letter.toLowerCase()]}
                    {isCorrect && ' (correct answer)'}
                    {isPicked && ' (your answer)'}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      <Link className="btn btn-outline" to="/">Back to dashboard</Link>
    </div>
  );
}
