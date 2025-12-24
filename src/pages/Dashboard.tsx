import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import Card from '../components/Card';
import QRCode from 'react-qr-code';
import './Dashboard.css';

// --- Firebase Imports ---
import { db, auth } from '../firebaseConfig'; 
import { collection, addDoc, Timestamp, doc, onSnapshot, getDoc } from 'firebase/firestore'; 
import { signOut } from 'firebase/auth'; // Import signOut

function Dashboard() {
  const navigate = useNavigate(); // Initialize navigation

  // --- Existing States ---
  const [qrValue, setQrValue] = useState<string>('');
  const [secondsLeft, setSecondsLeft] = useState<number>(30);
  const countdownRef = useRef<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [attendeeCount, setAttendeeCount] = useState<number>(0);

  // --- User Profile State ---
  const [userName, setUserName] = useState<string>('Professor');
  const [userRole, setUserRole] = useState<string>('');

  // --- NEW: Handle Logout ---
  const handleLogout = async () => {
    try {
      await signOut(auth); // Firebase Sign Out
      navigate('/'); // Redirect to Login Page
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // --- 1. Fetch User Profile ---
  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserName(data.name || "Professor");
            setUserRole(data.department || "Faculty");
          }
        } catch (err) {
          console.error("Error fetching profile:", err);
        }
      }
    };
    fetchProfile();
  }, []);

  // --- 2. Live Update Effect ---
  useEffect(() => {
    if (!qrValue) return;
    const sessionDocRef = doc(db, "attendance_sessions", qrValue);
    const unsubscribe = onSnapshot(sessionDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const currentAttendees = data.attendees || [];
        setAttendeeCount(currentAttendees.length);
      }
    });
    return () => unsubscribe();
  }, [qrValue]);

  // --- Generate QR Function ---
  const generateQR = async () => {
    setLoading(true);
    setError('');
    setAttendeeCount(0);
    if (countdownRef.current) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    const user = auth.currentUser;
    if (!user) {
      setError('You must be logged in to start a session.');
      setLoading(false);
      return;
    }

    try {
      const sessionData = {
        professorId: user.uid,
        courseName: "Default Course",
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromMillis(Date.now() + 30 * 1000), 
        attendees: [] 
      };
      
      const docRef = await addDoc(collection(db, "attendance_sessions"), sessionData);
      const newSessionId = docRef.id;
      
      setQrValue(newSessionId);
      setSecondsLeft(30);

      countdownRef.current = window.setInterval(() => {
        setSecondsLeft((prev) => {
          const next = Math.max(prev - 1, 0);
          if (next === 0) {
            if (countdownRef.current) {
              window.clearInterval(countdownRef.current);
              countdownRef.current = null;
            }
            setQrValue('');
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

  useEffect(() => {
    return () => {
      if (countdownRef.current) window.clearInterval(countdownRef.current);
    };
  }, []);

  // --- Helper: Get Initials ---
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const todaySchedule = [
    { time: '10:00 AM', course: 'Computer Networks', room: 'Room 301' },
    { time: '02:00 PM', course: 'Data Structures', room: 'Lab 2' },
  ];

  const recentActivity = [
    { id: 1, text: 'Posted "Unit 3 Notes"', time: '2 hours ago' },
    { id: 2, text: 'Marked 45 students present', time: 'Yesterday' },
  ];

  return (
    <div className="dashboard-page">
      <div className="gradient-bg" />
      
      {/* HEADER */}
      <header className="dashboard-header mount-fade" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        {/* LEFT SIDE: Welcome */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className="profile-avatar">
            {getInitials(userName)}
          </div>
          <div>
            <h1 className="dash-title">Welcome back, {userName.split(' ')[0]} 👋</h1>
            <p className="dash-subtitle">{userRole} • Here’s what’s happening today</p>
          </div>
        </div>

        {/* RIGHT SIDE: Logout Button */}
        <button className="btn ghost" onClick={handleLogout} style={{border: '1px solid rgba(255,255,255,0.2)'}}>
            Logout ↪
        </button>
      </header>

      {/* MAIN GRID LAYOUT */}
      <div className="dashboard-content-grid mount-rise">
        
        {/* --- LEFT COLUMN (2/3 width) --- */}
        <div className="main-col">
          
          {/* QR Card */}
          <Card title="Generate Attendance QR">
            <div className="qr-section-modern">
               <p className="card-desc">Start a live attendance session for your current class.</p>
               
               <div className="qr-action-area">
                  <button className="btn primary big-btn" onClick={generateQR} disabled={loading || qrValue !== ''}>
                     {loading ? 'Generating...' : (qrValue ? 'End Session' : 'Start Session')}
                  </button>
                  {qrValue && <span className="live-badge">🔴 Live</span>}
               </div>

               <div className="qr-display-area">
                  {qrValue ? (
                      <div className="qr-active-wrapper">
                         <QRCode value={qrValue} size={180} />
                         <p className="timer">{secondsLeft}s remaining</p>
                      </div>
                  ) : (
                      <div className="qr-placeholder-modern">
                        <div className="placeholder-icon">📱</div>
                        <p>QR Code will appear here</p>
                      </div>
                  )}
               </div>
            </div>
          </Card>

          {/* Recent Activity Feed */}
          <Card title="Recent Activity">
            <div className="activity-list">
              {recentActivity.map(act => (
                <div key={act.id} className="activity-item">
                  <div className="activity-dot"></div>
                  <div>
                    <p className="activity-text">{act.text}</p>
                    <p className="activity-time">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* --- RIGHT COLUMN (1/3 width) --- */}
        <div className="side-col">
           {/* Stats Row */}
           <div className="stats-mini-grid">
              <div className="stat-card-mini">
                <div className="stat-value">96%</div>
                <div className="stat-label">Attendance</div>
              </div>
              <div className="stat-card-mini">
                <div className="stat-value">{attendeeCount}</div>
                <div className="stat-label">Active</div>
              </div>
           </div>

           {/* Today's Schedule */}
           <Card title="Today's Schedule">
              <div className="schedule-list">
                {todaySchedule.map((cls, idx) => (
                  <div key={idx} className="schedule-item">
                    <div className="time-box">{cls.time}</div>
                    <div>
                      <p className="course-name">{cls.course}</p>
                      <p className="room-name">{cls.room}</p>
                    </div>
                  </div>
                ))}
                {todaySchedule.length === 0 && <p style={{color:'#64748b'}}>No classes today.</p>}
              </div>
           </Card>

           <div className="quick-actions">
              <button className="btn ghost full-width" onClick={() => alert('Feature coming soon!')}>
                 + Assign New Task
              </button>
              <button className="btn ghost full-width" onClick={() => alert('Feature coming soon!')}>
                 View Reports
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;