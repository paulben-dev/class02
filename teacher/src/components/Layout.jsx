import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

import { useState, useEffect } from 'react';
import { getClasses } from '../api/client';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [schoolName, setSchoolName] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
    { to: '/settings', label: '班级设置', icon: '⚙️' },
  ];

  const closeMobile = () => setMobileOpen(false);

  const sidebarContent = (
    <>
      <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)} title={collapsed ? '展开侧栏' : '收起侧栏'}>
        <span className="sidebar-toggle-icon">{collapsed ? '▶' : '◀'}</span>
      </button>

      <div className="sidebar-header">
        <h2 className="sidebar-app-name">{collapsed ? '徽' : '徽乐宝教学辅助系统'}</h2>
        {!collapsed && <span className="sidebar-role">教师端</span>}
        {!collapsed && schoolName && <span className="sidebar-school">{schoolName}</span>}
      </div>

      <nav className="sidebar-nav">
        {navLinks.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`sidebar-link ${pathname === link.to || (link.to !== '/' && pathname.startsWith(link.to)) ? 'active' : ''}`}
            onClick={closeMobile}
            title={collapsed ? link.label : undefined}
          >
            <span className="sidebar-link-icon">{link.icon}</span>
            <span className="sidebar-link-label">{link.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-user">{collapsed ? (user?.display_name?.[0] || '师') : (user?.display_name || user?.username)}</span>
        {!collapsed && user?.subject && <span className="sidebar-subject">{teacherSubjectLabel}</span>}
        <button onClick={logout} className="sidebar-logout-btn">
          {collapsed ? '⇥' : '退出登录'}
        </button>
      </div>
    </>
  );

  return (
    <div className={`layout ${collapsed ? 'layout-collapsed' : ''}`}>
      {/* Mobile overlay */}
      {mobileOpen && <div className="sidebar-overlay" onClick={closeMobile} />}

      {/* Mobile hamburger */}
      <button className="mobile-hamburger" onClick={() => setMobileOpen(!mobileOpen)}>
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>

      {/* Sidebar — desktop (fixed) + mobile (overlay) */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {sidebarContent}
      </aside>

      <main className="layout-content">{children}</main>
    </div>
  );
}
