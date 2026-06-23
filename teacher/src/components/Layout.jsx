import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

import { useState, useEffect } from 'react';
import { getClasses } from '../api/client';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [schoolName, setSchoolName] = useState('');

  const SUBJECT_LABELS = { math: '数学', chinese: '语文', english: '英语', physics: '物理', chemistry: '化学' };
  const teacherSubjectLabel = SUBJECT_LABELS[user?.subject] || user?.subject || '';

  useEffect(() => {
    getClasses().then(res => {
      const list = res.data.data || [];
      if (list.length > 0 && list[0].school_name) {
        setSchoolName(list[0].school_name);
      }
    }).catch(() => {});
  }, []);

  const navLinks = [
    { to: '/', label: '工作台', icon: '📋' },
    { to: '/assign', label: '布置作业', icon: '📝' },
    { to: '/grading', label: '批改作业', icon: '✅' },
    { to: '/settings', label: '设置', icon: '⚙️' },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-app-name">徽乐宝</h2>
          <span className="sidebar-role">教师端</span>
          {schoolName && <span className="sidebar-school">{schoolName}</span>}
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
          {user?.subject && <span className="sidebar-subject" style={{fontSize:'11px',color:'#8899aa',display:'block'}}>{teacherSubjectLabel}</span>}
          <button onClick={logout} className="sidebar-logout-btn">退出登录</button>
        </div>
      </aside>
      <main className="layout-content">{children}</main>
    </div>
  );
}
