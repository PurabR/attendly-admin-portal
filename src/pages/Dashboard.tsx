import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import QRCode from 'react-qr-code';
import './Dashboard.css';

// --- Firebase Imports ---
import { db, auth } from '../firebaseConfig'; 
import { 
  collection, 
  addDoc, 
  Timestamp, 
  doc, 
  onSnapshot, 
  getDoc, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore'; 
import { signOut } from 'firebase/auth';

function Dashboard() {
  const navigate = useNavigate();

  // --- States ---
  const [qrValue, setQrValue] = useState<string>('');
  const [secondsLeft, setSecondsLeft] = useState<number>(30);
  const countdownRef = useRef<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // --- Live Attendance States ---
  const [attendeeCount, setAttendeeCount] = useState<number>(0);
  const [lastScannedName, setLastScannedName] = useState<string>('');
  
  // Ref to track the previous count (to detect INCREASES)
  const prevCountRef = useRef<number>(0);

  // --- User Profile State ---
  const [userName, setUserName] = useState<string>('Professor');
  const [userRole, setUserRole] = useState<string>('');

  // --- 0. RESTORE SESSION ON RELOAD ---
  // This looks for any session created in the last 5 minutes so you don't lose it on refresh.
  useEffect(() => {
    const restoreSession = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
      
      try {
        const q = query(
          collection(db, "attendance_sessions"),
          where("professorId", "==", user.uid),
          where("createdAt", ">", Timestamp.fromDate(fiveMinutesAgo))
        );

        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          // Found a recent session!
          const latestDoc = snapshot.docs[0];
          setQrValue(latestDoc.id);
          
          // Restore timer logic (optional visual sync)
          const expiresAt = latestDoc.data().expiresAt.toDate();
          const secondsRemaining = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
          if (secondsRemaining > 0) {
            setSecondsLeft(secondsRemaining);
          }
        }
      } catch (err) {
        console.error("Error restoring session:", err);
      }
    };

    // Small delay to ensure Auth is ready
    setTimeout(restoreSession, 1000);
  }, []);

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

  // --- 2. LIVE LISTENER (The Core Logic) ---
  useEffect(() => {
    if (!qrValue) return;

    console.log("🟢 Live Listener Active for:", qrValue);
    const sessionDocRef = doc(db, "attendance_sessions", qrValue);
    
    const unsubscribe = onSnapshot(sessionDocRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const currentAttendees: string[] = data.attendees || [];
        const newCount = currentAttendees.length;

        // Update the big number
        setAttendeeCount(newCount);

        // CHECK: Did the count go UP? (New student scanned)
        if (newCount > prevCountRef.current) {
          // Get the ID of the last person added
          const latestStudentId = currentAttendees[newCount - 1];
          console.log("✨ New Scan Detected! ID:", latestStudentId);
          
          try {
            const userSnap = await getDoc(doc(db, "users", latestStudentId));
            if (userSnap.exists()) {
              const studentName = userSnap.data().name || "Unknown Student";
              setLastScannedName(studentName);
              
              // Clear name after 4 seconds
              setTimeout(() => setLastScannedName(''), 4000);
            }
          } catch (err) {
            console.error("Error fetching name:", err);
          }
        }

        // Update ref for next time
        prevCountRef.current = newCount;
      }
    });

    return () => unsubscribe();
  }, [qrValue]); 

  // --- 3. Generate QR Function ---
  const generateQR = async () => {
    setLoading(true);
    setError('');
    setAttendeeCount(0);
    setLastScannedName('');
    prevCountRef.current = 0; // Reset tracker

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
      setQrValue(docRef.id);
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

  // --- Helper: Logout ---
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // --- Helper: Initials ---
  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className="profile-avatar">{getInitials(userName)}</div>
          <div>
            <h1 className="dash-title">Welcome back, {userName.split(' ')[0]} 👋</h1>
            <p className="dash-subtitle">{userRole} • Here’s what’s happening today</p>
          </div>
        </div>
        <button className="btn ghost" onClick={handleLogout} style={{border: '1px solid rgba(255,255,255,0.2)'}}>
            Logout ↪
        </button>
      </header>

      {/* MAIN GRID */}
      <div className="dashboard-content-grid mount-rise">
        
        {/* --- LEFT COLUMN --- */}
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

               <div className="qr-display-area" style={{ display: 'flex', gap: '40px', alignItems: 'center', justifyContent: 'center', marginTop: '30px' }}>
                  
                  {/* 1. The QR Code */}
                  {qrValue ? (
                      <div className="qr-active-wrapper">
                         <QRCode value={qrValue} size={220} />
                         <p className="timer" style={{color: secondsLeft < 10 ? '#ff4d4d' : '#fff'}}>
                           {secondsLeft}s remaining
                         </p>
                      </div>
                  ) : (
                      <div className="qr-placeholder-modern">
                        <div className="placeholder-icon">📱</div>
                        <p>QR Code will appear here</p>
                      </div>
                  )}

                  {/* 2. BIG LIVE COUNTER (Only visible when QR is active) */}
                  {qrValue && (
                    <div className="live-counter-box mount-rise">
                        <div style={{fontSize: '5rem', fontWeight: '800', color: '#4ade80', lineHeight: 1}}>
                            {attendeeCount}
                        </div>
                        <div style={{color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem', marginBottom: '20px'}}>
                            Students Present
                        </div>

                        {/* 3. LIVE NAME TOAST */}
                        <div style={{height: '40px'}}> 
                            {lastScannedName && (
                                <div className="scanned-toast mount-rise">
                                    <span style={{marginRight: '8px'}}>✨</span> 
                                    {lastScannedName} just joined!
                                </div>
                            )}
                        </div>
                    </div>
                  )}
               </div>
            </div>
          </Card>

          {/* Recent Activity */}
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

        {/* --- RIGHT COLUMN --- */}
        <div className="side-col">
           <div className="stats-mini-grid">
              <div className="stat-card-mini">
                <div className="stat-value">96%</div>
                <div className="stat-label">Avg. Attendance</div>
              </div>
              <div className="stat-card-mini">
                <div className="stat-value">{attendeeCount}</div>
                <div className="stat-label">Active Session</div>
              </div>
           </div>

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