import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 24 }}>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.username || 'Teacher'}</p>
      <nav style={{ display: 'flex', gap: 16, marginTop: 16 }}>
        <Link to="/assign">Assign Homework</Link>
        <Link to="/grading">Grading List</Link>
      </nav>
      <button onClick={logout} style={{ marginTop: 24, padding: '8px 16px' }}>
        Logout
      </button>
    </div>
  );
}
