import React, { useEffect, useRef, useState } from 'react';
import Card from '../components/Card';
import QRCode from 'react-qr-code';
import './Dashboard.css';

// --- Firebase Imports ---
import { db, auth } from '../firebaseConfig'; // Import our db and auth services
import { collection, addDoc, Timestamp } from 'firebase/firestore'; // Import firestore functions

function Dashboard() {
  // --- Your States (Perfect) ---
  const [qrValue, setQrValue] = useState<string>('');
  const [secondsLeft, setSecondsLeft] = useState<number>(30); // Your 30-second timer
  const countdownRef = useRef<number | null>(null);

  // --- New States for Firebase ---
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // --- Merged generateQR Function ---
  const generateQR = async () => {
    setLoading(true);
    setError('');

    // Clear any existing countdown (Your logic)
    if (countdownRef.current) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    // 1. Get the current logged-in user
    const user = auth.currentUser;
    if (!user) {
      setError('You must be logged in to start a session.');
      setLoading(false);
      return;
    }

    try {
      // 2. Create a new "session" document in Firestore
      const sessionData = {
        professorId: user.uid,
        courseName: "Default Course", // We can make this dynamic later
        createdAt: Timestamp.now(),
        // Let's also store when it expires, based on your timer
        expiresAt: Timestamp.fromMillis(Date.now() + 30 * 1000), // 30 seconds from now
        attendees: [] // Start with an empty list
      };
      
      const docRef = await addDoc(collection(db, "attendance_sessions"), sessionData);
      
      // 3. This is the unique ID for the session.
      const newSessionId = docRef.id;
      console.log("Session created with ID: ", newSessionId);

      // 4. Set state and start YOUR countdown (Your logic)
      setQrValue(newSessionId);
      setSecondsLeft(30);

      countdownRef.current = window.setInterval(() => {
        setSecondsLeft((prev) => {
          const next = Math.max(prev - 1, 0);
          if (next === 0) {
            // Stop interval and clear QR
            if (countdownRef.current) {
              window.clearInterval(countdownRef.current);
              countdownRef.current = null;
            }
            setQrValue('');
            // We could also update the doc in Firestore to "expired: true"
          }
          return next;
        });
      }, 1000);

    } catch (err) {
      console.error("Error creating session:", err);
      setError('Failed to create session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup on unmount (Your logic, perfect)
  useEffect(() => {
    return () => {
      if (countdownRef.current) window.clearInterval(countdownRef.current);
    };
  }, []);

  // --- Your JSX (with minor updates for loading/error) ---
  return (
    <div className="dashboard-page">
      <div className="gradient-bg" />
      <header className="dashboard-header mount-fade">
        <div>
          <h1 className="dash-title">Welcome back 👋</h1>
          <p className="dash-subtitle">Here’s what’s happening today</p>
          {/* Display error if one exists */}
          {error && <p style={{ color: '#ff4d4d', marginTop: '10px' }}>{error}</p>}
        </div>
        <div className="dash-actions">
          {/* Updated button logic */}
          <button className="btn primary" onClick={generateQR} disabled={loading || qrValue !== ''}>
            {loading ? 'Generating...' : (qrValue ? 'QR Active' : 'Generate QR')}
          </button>
          <button className="btn ghost" onClick={() => alert('Feature coming soon!')}>Assign Task</button>
        </div>
      </header>

      <section className="stats-grid mount-rise">
        {/* Your stats, unchanged */}
        <div className="stat">
          <div className="stat-value">96%</div>
          <div className="stat-label">Avg. Attendance</div>
        </div>
        <div className="stat">
          <div className="stat-value">3</div>
          <div className="stat-label">Pending Tasks</div>
        </div>
        <div className="stat">
          <div className="stat-value">28</div>
          <div className="stat-label">Students Present</div>
        </div>
      </section>

      <div className="dashboard-grid">
        <Card title="Generate Attendance QR Code">
          <p>Click the button to generate a unique, 30-second QR code for your class.</p>
          {/* Updated button logic */}
          <button className="btn primary" onClick={generateQR} disabled={loading || qrValue !== ''}>
            {loading ? 'Generating...' : (qrValue ? 'QR Code Active' : 'Generate QR Code')}
          </button>

          <div className="qr-container">
            {qrValue ? (
              <div style={{ textAlign: 'center' }}>
                <div className="qr-wrap mount-rise">
                  <QRCode value={qrValue} size={200} />
                </div>
                {/* Your countdown logic, unchanged */}
                <p className="qr-expire">Expires in <span className="countdown">{secondsLeft}</span> seconds</p>
              </div>
            ) : (
              <p className="qr-placeholder">QR code will appear here.</p>
            )}
          </div>
        </Card>

        <Card title="Assign Task">
          {/* Your card, unchanged */}
          <p>Quickly assign a new task or announcement to your classes.</p>
          <button className="btn ghost" onClick={() => alert('Feature coming soon!')}>Assign New Task</button>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;