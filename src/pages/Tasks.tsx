import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import './Tasks.css';

// --- Firebase Imports ---
import { db, auth } from '../firebaseConfig';
import {
  collection,
  addDoc,
  Timestamp,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';

// Your Task interface - let's add a 'status'
interface TaskItem {
  id: string; // This will be the Firestore document ID
  title: string;
  className: string;
  dueDate: string;
  status: 'pending' | 'submitted';
}

function Tasks() {
  // --- Form States ---
  const [title, setTitle] = useState<string>('');
  const [className, setClassName] = useState<string>('7th Semester'); // Default to 7th
  const [dueDate, setDueDate] = useState<string>('');

  // --- UI States (for form feedback) ---
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // --- Real-time Task States ---
  // These are no longer hardcoded! They will be filled by our listener.
  const [pending, setPending] = useState<TaskItem[]>([]);
  const [submitted, setSubmitted] = useState<TaskItem[]>([]);

  // --- 1. REAL-TIME DATA FETCHING ---
  useEffect(() => {
  // We need to store our database listener so we can stop it later
  let dbUnsubscribe = () => {};

  // This is the auth listener
  const authUnsubscribe = auth.onAuthStateChanged((user) => {
    if (user) {
      // --- User is logged in! ---
      // Now we can safely set up the database listener
      
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('professorId', '==', user.uid)
      );

      // Assign the real unsubscribe function
      dbUnsubscribe = onSnapshot(tasksQuery, (snapshot) => {
        const allTasks: TaskItem[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          allTasks.push({
            id: doc.id,
            title: data.title,
            className: data.className,
            dueDate: data.dueDate.toDate().toISOString().split('T')[0],
            status: data.status,
          });
        });

        // Split tasks (your logic is perfect)
        setPending(allTasks.filter((task) => task.status === 'pending'));
        setSubmitted(allTasks.filter((task) => task.status === 'submitted'));
      });
    } else {
      // --- User is logged out ---
      // Stop listening to the database
      dbUnsubscribe();
      // Clear the lists
      setPending([]);
      setSubmitted([]);
    }
  });

  // Cleanup: when the component unmounts, stop both listeners
  return () => {
    authUnsubscribe();
    dbUnsubscribe();
  };
}, []); // Empty array means this runs once on mount

  // --- 2. ASSIGN TASK (WRITE TO DB) ---
  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !className || !dueDate) {
      setError('Please fill out all fields.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const user = auth.currentUser;
    if (!user) {
      setError('You must be logged in.');
      setLoading(false);
      return;
    }

    try {
      // Create the new task document data
      const taskData = {
        professorId: user.uid,
        title: title,
        className: className,
        dueDate: Timestamp.fromDate(new Date(dueDate)), // Convert string to Timestamp
        assignedAt: Timestamp.now(),
        status: 'pending', // All new tasks are 'pending'
      };

      await addDoc(collection(db, 'tasks'), taskData);

      // Success!
      setSuccess('Task assigned successfully!');
      setTitle('');
      setDueDate('');
      // The onSnapshot listener will automatically add the new task to the UI
    } catch (err) {
      console.error('Error assigning task:', err);
      setError('Failed to assign task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- 3. UPDATE TASK (UPDATE DB) ---
  const markSubmitted = async (id: string) => {
    // This function will now move a task from 'pending' to 'submitted'
    const taskDocRef = doc(db, 'tasks', id);
    try {
      await updateDoc(taskDocRef, {
        status: 'submitted',
      });
      // The onSnapshot listener will see this change and automatically
      // move the task from the "Pending" list to the "Submitted" list!
    } catch (err) {
      console.error('Error updating task:', err);
      alert('Failed to update task.');
    }
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
                <input
                  id="task-title"
                  type="text"
                  placeholder="e.g., Graphs Worksheet"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="field">
                <label htmlFor="task-class">Class</label>
                <select
                  id="task-class"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  disabled={loading}
                >
                  <option>1st Semester</option>
                  <option>3rd Semester</option>
                  <option>5th Semester</option>
                  <option>7th Semester</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="task-due">Due</label>
                <input
                  id="task-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? 'Assigning...' : 'Assign Task'}
            </button>
            
            {/* --- Feedback Messages --- */}
            {success && <p className="form-message success">{success}</p>}
            {error && <p className="form-message error">{error}</p>}
          </form>
        </Card>

        <Card title="Pending Tasks">
          <ul className="task-list">
            {pending.map((t) => (
              <li key={t.id} className="task-item">
                <div className="meta">
                  <div className="title">{t.title}</div>
                  <div className="sub">
                    {t.className} • Due {t.dueDate}
                  </div>
                </div>
                <div className="actions">
                  <button className="btn ghost" onClick={() => markSubmitted(t.id)}>
                    Mark Submitted
                  </button>
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
                  <div className="sub">
                    {t.className} • Due {t.dueDate}
                  </div>
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