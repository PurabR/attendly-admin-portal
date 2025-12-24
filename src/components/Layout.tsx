import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import './Layout.css';
import logoImage from '../images/logo.png'; // Your logo

const Layout = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/attendance', label: 'Attendance', icon: '📅' },
    { path: '/tasks', label: 'Tasks', icon: '📝' },
  ];

  return (
    <div className="app-layout">
      {/* --- SIDEBAR --- */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src={logoImage} alt="Attendly Logo" className="sidebar-logo" />
          {/* Optional: Add text next to logo if needed, or just use the logo */}
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
            <p className="footer-text">© 2025 Attendly</p>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="main-content">
        <Outlet /> {/* This is where Dashboard/Attendance/Tasks will render */}
      </main>
    </div>
  );
};

export default Layout;