import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css'; // We'll create this CSS file next

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>Admin Portal</h3>
      </div>
      <nav className="sidebar-nav">
  <Link to="/dashboard">Dashboard</Link>
  <Link to="/dashboard/attendance">Attendance</Link>
  <Link to="/dashboard/tasks">Tasks</Link>
  <Link to="/login" className="logout-btn">Logout</Link>
</nav>
    </div>
  );
}

export default Sidebar;