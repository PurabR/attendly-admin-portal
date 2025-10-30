import React from 'react';
import Card from '../components/Card';
import './Attendance.css';

function Attendance() {
  const totalAttendanceRecords = 1284;
  const totalClasses = 6;
  const averageAttendance = 94; // percent

  const perClassAverage = [
    { name: '1st Semester', average: 96 },
    { name: '3rd Semester', average: 92 },
    { name: '5th Semester', average: 95 },
    { name: '7th Semester', average: 90 },
  ];

  const topStudents = [
    { name: 'Aarav Sharma', percentage: 100 },
    { name: 'Isha Verma', percentage: 99 },
    { name: 'Kabir Mehta', percentage: 99 }
  ];

  const lowStudents = [
    { name: 'Riya Kapoor', percentage: 72 },
    { name: 'Arjun Singh', percentage: 70 },
    { name: 'Myra Patel', percentage: 68 }
  ];

  return (
    <div className="attendance-page">
      <div className="gradient-bg" />
      <header className="dashboard-header mount-fade">
        <div>
          <h1 className="dash-title">Attendance Overview</h1>
          <p className="dash-subtitle">Snapshot of your classes</p>
        </div>
      </header>

      <section className="stats-grid mount-rise">
        <div className="stat">
          <div className="stat-value">{averageAttendance}%</div>
          <div className="stat-label">Average Attendance</div>
        </div>
        <div className="stat">
          <div className="stat-value">{totalClasses}</div>
          <div className="stat-label">Total Classes</div>
        </div>
        <div className="stat">
          <div className="stat-value">{totalAttendanceRecords}</div>
          <div className="stat-label">Total Records</div>
        </div>
      </section>

      <div className="dashboard-grid">
        <Card title="Per-class Average Attendance">
          <ul className="list">
            {perClassAverage.map((c) => (
              <li key={c.name} className="list-item">
                <span>{c.name}</span>
                <span className="pill">{c.average}%</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Students With Highest Attendance">
          <ul className="list">
            {topStudents.map((s) => (
              <li key={s.name} className="list-item">
                <span>{s.name}</span>
                <span className="pill success">{s.percentage}%</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Students With Lowest Attendance">
          <ul className="list">
            {lowStudents.map((s) => (
              <li key={s.name} className="list-item">
                <span>{s.name}</span>
                <span className="pill danger">{s.percentage}%</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

export default Attendance;