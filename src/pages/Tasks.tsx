import React, { useState } from 'react';
import Card from '../components/Card';
import './Tasks.css';

interface TaskItem {
  id: string;
  title: string;
  className: string;
  dueDate: string;
}

function Tasks() {
  const [title, setTitle] = useState<string>('');
  const [className, setClassName] = useState<string>('1st Semester');
  const [dueDate, setDueDate] = useState<string>('');

  const [pending, setPending] = useState<TaskItem[]>([
    { id: 't1', title: 'Linear Algebra Worksheet', className: '1st Semester', dueDate: '2025-11-02' },
    { id: 't2', title: 'OS: Process Scheduling Quiz', className: '3rd Semester', dueDate: '2025-11-05' }
  ]);

  const [submitted, setSubmitted] = useState<TaskItem[]>([
    { id: 's1', title: 'Intro to C Assignment 1', className: '1st Semester', dueDate: '2025-10-15' },
    { id: 's2', title: 'DBMS ER Diagram', className: '3rd Semester', dueDate: '2025-10-20' }
  ]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !className || !dueDate) return;
    const newTask: TaskItem = {
      id: crypto.randomUUID(),
      title,
      className,
      dueDate
    };
    setPending((prev) => [newTask, ...prev]);
    setTitle('');
    setDueDate('');
  };

  const markSubmitted = (id: string) => {
    const t = pending.find((p) => p.id === id);
    if (!t) return;
    setPending((prev) => prev.filter((p) => p.id !== id));
    setSubmitted((prev) => [{ ...t }, ...prev]);
  };

  return (
    <div className="tasks-page">
      <div className="gradient-bg" />
      <header className="dashboard-header mount-fade">
        <div>
          <h1 className="dash-title">Tasks</h1>
          <p className="dash-subtitle">Assign, track pending, and review submissions</p>
        </div>
      </header>

      <div className="dashboard-grid">
        <Card title="Assign New Task">
          <form className="task-form" onSubmit={addTask}>
            <div className="row">
              <div className="field">
                <label htmlFor="task-title">Title</label>
                <input id="task-title" type="text" placeholder="e.g., Graphs Worksheet" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="task-class">Class</label>
                <select id="task-class" value={className} onChange={(e) => setClassName(e.target.value)}>
                  <option>1st Semester</option>
                  <option>3rd Semester</option>
                  <option>5th Semester</option>
                  <option>7th Semester</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="task-due">Due</label>
                <input id="task-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn primary">Assign Task</button>
          </form>
        </Card>

        <Card title="Pending Tasks">
          <ul className="task-list">
            {pending.map((t) => (
              <li key={t.id} className="task-item">
                <div className="meta">
                  <div className="title">{t.title}</div>
                  <div className="sub">{t.className} • Due {t.dueDate}</div>
                </div>
                <div className="actions">
                  <button className="btn ghost" onClick={() => markSubmitted(t.id)}>Mark Submitted</button>
                </div>
              </li>
            ))}
            {pending.length === 0 && <li className="empty">No pending tasks</li>}
          </ul>
        </Card>

        <Card title="Submitted Tasks">
          <ul className="task-list">
            {submitted.map((t) => (
              <li key={t.id} className="task-item">
                <div className="meta">
                  <div className="title">{t.title}</div>
                  <div className="sub">{t.className} • Due {t.dueDate}</div>
                </div>
                <div className="pill success">Submitted</div>
              </li>
            ))}
            {submitted.length === 0 && <li className="empty">No submissions yet</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}

export default Tasks;