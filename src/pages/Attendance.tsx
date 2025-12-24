import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import './Attendance.css';
import { db, auth } from '../firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  Timestamp,
  onSnapshot 
} from 'firebase/firestore';

interface Session {
  id: string;
  courseName: string;
  createdAt: Timestamp;
  attendees: string[];
}

function Attendance() {
  // --- States ---
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [studentNames, setStudentNames] = useState<Record<string, string>>({});
  const [loadingNames, setLoadingNames] = useState(false);

  // --- 1. Fetch Real Sessions (Fixed for Reload + Index Issue) ---
  useEffect(() => {
    // We use onAuthStateChanged to ensure we wait for the user to be logged in
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // NOTE: I removed 'orderBy' temporarily to avoid Index errors.
          // Once this works, we can add sorting back.
          const q = query(
            collection(db, "attendance_sessions"),
            where("professorId", "==", user.uid)
          );

          const querySnapshot = await getDocs(q);
          const fetchedSessions: Session[] = [];
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            fetchedSessions.push({
              id: doc.id,
              courseName: data.courseName || "Class Session",
              createdAt: data.createdAt,
              attendees: data.attendees || []
            });
          });

          // Manual sort in JavaScript since we removed Firestore orderBy
          fetchedSessions.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

          setSessions(fetchedSessions);
        } catch (error) {
          console.error("Error fetching sessions:", error);
        } finally {
          setLoading(false);
        }
      } else {
        // User is not logged in
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // --- 2. Calculate Real Stats ---
  const totalClasses = sessions.length;
  const totalAttendanceRecords = sessions.reduce((acc, curr) => acc + curr.attendees.length, 0);
  const avgAttendees = totalClasses > 0 ? Math.round(totalAttendanceRecords / totalClasses) : 0;

  // --- 3. Handle Expand (Fetch Names) ---
  const handleToggleSession = async (sessionId: string, attendeeIds: string[]) => {
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
      return;
    }
    setExpandedSessionId(sessionId);

    if (attendeeIds.length === 0) return;

    // Filter IDs we don't know yet
    const missingIds = attendeeIds.filter(id => !studentNames[id]);
    if (missingIds.length === 0) return;

    setLoadingNames(true);
    const newNames: Record<string, string> = {};

    try {
      await Promise.all(
        missingIds.map(async (uid) => {
          const userDocRef = doc(db, "users", uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            newNames[uid] = userSnap.data().name || "Unknown";
          } else {
            newNames[uid] = "ID: " + uid.substring(0, 5);
          }
        })
      );
      setStudentNames(prev => ({ ...prev, ...newNames }));
    } catch (error) {
      console.error("Error fetching names:", error);
    } finally {
      setLoadingNames(false);
    }
  };

  const formatDate = (ts: Timestamp) => {
    if (!ts) return "";
    return new Date(ts.seconds * 1000).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="attendance-page">
      <div className="gradient-bg" />
      <header className="dashboard-header mount-fade">
        <div>
          <h1 className="dash-title">Attendance History</h1>
          <p className="dash-subtitle">Real-time records from your classes</p>
        </div>
      </header>

      {/* --- REAL STATS --- */}
      <section className="stats-grid mount-rise">
        <div className="stat">
          <div className="stat-value">{totalClasses}</div>
          <div className="stat-label">Total Sessions</div>
        </div>
        <div className="stat">
          <div className="stat-value">{totalAttendanceRecords}</div>
          <div className="stat-label">Total Student Scans</div>
        </div>
        <div className="stat">
          <div className="stat-value">{avgAttendees}</div>
          <div className="stat-label">Avg. Students / Class</div>
        </div>
      </section>

      {/* --- REAL DATA LIST --- */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}> 
        <Card title="Recent Sessions">
          {loading ? (
             <p style={{padding: '20px', color: '#94a3b8'}}>Loading sessions...</p>
          ) : sessions.length === 0 ? (
             <p style={{padding: '20px', color: '#94a3b8'}}>No sessions created yet.</p>
          ) : (
            <div className="list">
              {sessions.map((session) => (
                <div key={session.id} style={{borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '10px'}}>
                  
                  {/* Clickable Header */}
                  <div 
                    className="session-header" 
                    onClick={() => handleToggleSession(session.id, session.attendees)}
                  >
                    <div className="session-info">
                      <h3>{session.courseName}</h3>
                      <div className="session-date">{formatDate(session.createdAt)}</div>
                    </div>
                    <div>
                      <span className="pill success">{session.attendees.length} Present</span>
                      <span className="expand-icon">{expandedSessionId === session.id ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Expanded List */}
                  {expandedSessionId === session.id && (
                    <div className="session-details mount-fade">
                      {loadingNames ? (
                        <p style={{fontSize: '0.9rem', color: '#94a3b8'}}>Loading names...</p>
                      ) : session.attendees.length === 0 ? (
                        <p style={{fontSize: '0.9rem', color: '#94a3b8'}}>No students scanned.</p>
                      ) : (
                        <ul className="student-list">
                          {session.attendees.map(uid => (
                            <li key={uid} className="student-item">
                              <div className="student-avatar">
                                {(studentNames[uid] || "?").charAt(0).toUpperCase()}
                              </div>
                              <span>{studentNames[uid] || "Loading..."}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default Attendance;