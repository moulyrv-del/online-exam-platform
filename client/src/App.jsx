import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Auth from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Exam from './pages/Exam.jsx';
import Result from './pages/Result.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminQuestions from './pages/AdminQuestions.jsx';

export default function App() {
  const location = useLocation();
  // Hide the top bar while a student is taking an exam
  const inExam = location.pathname.startsWith('/exam/');

  return (
    <>
      {!inExam && <Navbar />}
      <Routes>
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/exam/:id" element={<ProtectedRoute><Exam /></ProtectedRoute>} />
        <Route path="/result/:attemptId" element={<ProtectedRoute><Result /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/exams/:id" element={<ProtectedRoute adminOnly><AdminQuestions /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
