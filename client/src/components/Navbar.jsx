import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="navbar">
      <Link to="/" className="brand">ExamPortal</Link>
      <nav className="nav-links">
        {user && <Link to="/">Exams</Link>}
        {user && user.role === 'admin' && <Link to="/admin">Admin</Link>}
        {user ? (
          <>
            <span className="nav-user">{user.name}</span>
            <button className="btn btn-outline btn-small" onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}
