import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const navLinks = [
    { to: '/', label: '工作台', icon: '📋' },
    { to: '/assign', label: '布置作业', icon: '📝' },
    { to: '/grading', label: '批改作业', icon: '✅' },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-app-name">徽乐宝</h2>
          <span className="sidebar-role">教师端</span>
        </div>
        <nav className="sidebar-nav">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`sidebar-link ${pathname === link.to || (link.to !== '/' && pathname.startsWith(link.to)) ? 'active' : ''}`}
            >
              <span className="sidebar-link-icon">{link.icon}</span>
              <span className="sidebar-link-label">{link.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="sidebar-user">{user?.display_name || user?.username}</span>
          <button onClick={logout} className="sidebar-logout-btn">退出登录</button>
        </div>
      </aside>
      <main className="layout-content">{children}</main>
    </div>
  );
}
