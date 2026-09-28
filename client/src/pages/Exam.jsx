import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';

const LETTERS = ['A', 'B', 'C', 'D'];

function formatTime(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  const minutes = String(Math.floor(s / 60)).padStart(2, '0');
  const seconds = String(s % 60).padStart(2, '0');
  return minutes + ':' + seconds;
}

export default function Exam() {
  const { id } = useParams();
  const navigate = useNavigate();

  // phase: camera -> running -> submitting   (or denied / error / submitError)
  const [phase, setPhase] = useState('camera');
  const [message, setMessage] = useState('');
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { questionId: 'A' }
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [warnings, setWarnings] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [stream, setStream] = useState(null);

  // Refs hold values that timers/event listeners need to read without going stale
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const attemptIdRef = useRef(null);
  const answersRef = useRef({});
  const submittingRef = useRef(false);
  const lastWarningRef = useRef(0);
  const aliveRef = useRef(true);

  // ---------- 1. Webcam, then start the exam ----------
  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  async function startCamera() {
    setPhase('camera');
    setMessage('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMessage('Your browser cannot access the webcam. Use Chrome, Edge or Firefox on http://localhost.');
      setPhase('denied');
      return;
    }

    let mediaStream;
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    } catch (err) {
      setMessage('Camera access was blocked or no camera was found. Allow the camera for this site and try again.');
      setPhase('denied');
      return;
    }

    if (!aliveRef.current) {
      mediaStream.getTracks().forEach((t) => t.stop());
      return;
    }
    streamRef.current = mediaStream;
    setStream(mediaStream);

    try {
      const data = await api('/exams/' + id + '/start', { method: 'POST' });
      attemptIdRef.current = data.attemptId;
      setExam(data.exam);
      setQuestions(data.questions);
      setWarnings(data.warningCount);
      setSecondsLeft(data.remainingSeconds);

      // Answers saved on the server come back after a refresh
      answersRef.current = data.savedAnswers || {};
      setAnswers(data.savedAnswers || {});
      setPhase('running');
    } catch (err) {
      stopCamera();
      setMessage(err.message);
      setPhase('error');
    }
  }

  useEffect(() => {
    aliveRef.current = true;
    startCamera();
    return () => {
      aliveRef.current = false;
      stopCamera(); // camera is always released when leaving this page
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show the camera stream inside the small <video> box
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream, phase]);

  // ---------- 2. Countdown timer ----------
  useEffect(() => {
    if (phase !== 'running') return;
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === 'running' && secondsLeft <= 0) submitExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, phase]);

  // ---------- 3. Tab / window switch detection ----------
  useEffect(() => {
    if (phase !== 'running') return;

    function flagLeaving() {
      // Switching tabs fires two events (blur + hidden), so count once per 2 seconds
      const now = Date.now();
      if (now - lastWarningRef.current < 2000) return;
      lastWarningRef.current = now;

      setShowWarning(true);
      setWarnings((w) => w + 1);
      api('/attempts/' + attemptIdRef.current + '/warning', { method: 'POST' })
        .then((data) => setWarnings(data.warningCount))
        .catch(() => {});
    }

    function onVisibilityChange() {
      if (document.hidden) flagLeaving();
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', flagLeaving);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', flagLeaving);
    };
  }, [phase]);

  // ---------- 4. Answers and navigation ----------
  // Each change is saved on the server straight away. The final submit also sends
  // the full list, so a failed save cannot lose an answer.
  function saveToServer(questionId, selected) {
    api('/attempts/' + attemptIdRef.current + '/answer', {
      method: 'PUT',
      body: { questionId, selected },
    }).catch(() => {});
  }

  function selectAnswer(questionId, letter) {
    const updated = { ...answersRef.current, [questionId]: letter };
    answersRef.current = updated;
    setAnswers(updated);
    saveToServer(questionId, letter);
  }

  function clearAnswer(questionId) {
    const updated = { ...answersRef.current };
    delete updated[questionId];
    answersRef.current = updated;
    setAnswers(updated);
    saveToServer(questionId, null);
  }

  // ---------- 5. Submit (manual or automatic when time is up) ----------
  async function submitExam() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setShowConfirm(false);
    setPhase('submitting');

    try {
      await api('/attempts/' + attemptIdRef.current + '/submit', {
        method: 'POST',
        body: { answers: answersRef.current },
      });
      stopCamera();
      navigate('/result/' + attemptIdRef.current, { replace: true });
    } catch (err) {
      submittingRef.current = false;
      setMessage(err.message);
      setPhase('submitError');
    }
  }

  // ---------- Screens ----------
  if (phase === 'camera') {
    return (
      <div className="center-wrap">
        <div className="card center-card">
          <h2>Getting ready...</h2>
          <p>Your browser will ask for camera permission. Click <strong>Allow</strong> to begin.</p>
        </div>
      </div>
    );
  }

  if (phase === 'denied' || phase === 'error') {
    return (
      <div className="center-wrap">
        <div className="card center-card">
          <h2>{phase === 'denied' ? 'Camera is required' : 'Could not start the exam'}</h2>
          <div className="alert alert-error">{message}</div>
          <div className="button-row">
            <button className="btn btn-primary" onClick={startCamera}>Try again</button>
            <Link className="btn btn-outline" to="/">Back to dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'submitError') {
    return (
      <div className="center-wrap">
        <div className="card center-card">
          <h2>Your answers were not submitted</h2>
          <div className="alert alert-error">{message}</div>
          <p>Your answers are still on this page. Check that the server is running, then try again.</p>
          <button className="btn btn-primary" onClick={submitExam}>Submit again</button>
        </div>
      </div>
    );
  }

  const question = questions[current];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="exam-page">
      <div className="exam-header">
        <div>
          <h2>{exam.title}</h2>
          <small className="muted">Question {current + 1} of {questions.length}</small>
        </div>
        <div className="exam-header-right">
          <span className={'badge ' + (warnings > 0 ? 'badge-warn' : 'badge-ok')}>Warnings: {warnings}</span>
          <span className={'timer ' + (secondsLeft < 60 ? 'timer-low' : '')}>{formatTime(secondsLeft)}</span>
        </div>
      </div>

      <div className="exam-body">
        <div className="card question-card">
          <p className="muted">{question.marks} mark{question.marks > 1 ? 's' : ''}</p>
          <h3>{current + 1}. {question.question_text}</h3>

          {LETTERS.map((letter) => (
            <button
              key={letter}
              className={'option ' + (answers[question.id] === letter ? 'selected' : '')}
              onClick={() => selectAnswer(question.id, letter)}
            >
              <span className="option-letter">{letter}</span>
              {question['option_' + letter.toLowerCase()]}
            </button>
          ))}

          <div className="question-actions">
            <button className="btn btn-outline" disabled={current === 0} onClick={() => setCurrent(current - 1)}>Previous</button>
            <button className="btn btn-outline" disabled={!answers[question.id]} onClick={() => clearAnswer(question.id)}>Clear answer</button>
            <button className="btn btn-primary" disabled={current === questions.length - 1} onClick={() => setCurrent(current + 1)}>Next</button>
          </div>
        </div>

        <aside className="exam-side">
          <div className="card cam-card">
            <video ref={videoRef} autoPlay muted playsInline className="cam-video" />
            <small><span className="rec-dot"></span> Camera is on</small>
          </div>

          <div className="card">
            <h4>Questions</h4>
            <div className="nav-grid">
              {questions.map((q, index) => (
                <button
                  key={q.id}
                  className={'nav-btn ' + (answers[q.id] ? 'answered ' : '') + (index === current ? 'current' : '')}
                  onClick={() => setCurrent(index)}
                  aria-label={'Go to question ' + (index + 1)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <p className="legend">
              <span className="legend-box answered"></span> Answered ({answeredCount})
              <span className="legend-box"></span> Not answered ({questions.length - answeredCount})
            </p>
            <button className="btn btn-primary btn-block" onClick={() => setShowConfirm(true)}>Submit exam</button>
          </div>

          <p className="disclaimer">
            Basic browser-based monitoring only. Leaving this tab or window adds a warning to your attempt.
          </p>
        </aside>
      </div>

      {showWarning && phase === 'running' && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Warning: you left the exam</h3>
            <p>Switching tabs or windows is recorded. Total warnings so far: <strong>{warnings}</strong>.</p>
            <button className="btn btn-primary" onClick={() => setShowWarning(false)}>Return to exam</button>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Submit your exam?</h3>
            <p>
              You answered {answeredCount} of {questions.length} questions.
              {answeredCount < questions.length && ' Unanswered questions get no marks.'} You cannot change answers after submitting.
            </p>
            <div className="button-row">
              <button className="btn btn-outline" onClick={() => setShowConfirm(false)}>Keep working</button>
              <button className="btn btn-primary" onClick={submitExam}>Yes, submit</button>
            </div>
          </div>
        </div>
      )}

      {phase === 'submitting' && (
        <div className="modal-overlay">
          <div className="modal"><h3>Submitting and marking your exam...</h3></div>
        </div>
      )}
    </div>
  );
}
