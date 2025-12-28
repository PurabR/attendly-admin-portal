import React, { useEffect, useState, useMemo } from 'react';
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
  Timestamp 
} from 'firebase/firestore';

// --- Recharts Imports ---
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

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
  
  // --- New State for Graph Filter ---
  const [viewMode, setViewMode] = useState<'month' | 'semester'>('month');

  // --- 1. Fetch Real Sessions ---
  useEffect(() => {

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Query sessions created by this professor
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

          // Sort Newest -> Oldest (Best for the list view)
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

  // --- 2. Process Data for Chart (Memoized) ---
  const chartData = useMemo(() => {
    if (sessions.length === 0) return [];

    const now = new Date();
    const cutoffDate = new Date();

    // Set the time range based on the toggle
    if (viewMode === 'month') {
      cutoffDate.setDate(now.getDate() - 30); // Last 30 days
    } else {
      cutoffDate.setMonth(now.getMonth() - 6); // Last 6 months
    }

    // 1. Filter sessions that are within the date range
    const filtered = sessions.filter(s => {
      if (!s.createdAt) return false;
      return s.createdAt.toDate() >= cutoffDate;
    });

    // 2. Sort Oldest -> Newest (Charts must go Left to Right)
    filtered.sort((a, b) => a.createdAt.seconds - b.createdAt.seconds);

    // 3. Group data by Date (e.g., "Oct 25")
    const dataMap: Record<string, number> = {};

    filtered.forEach(session => {
      const dateObj = session.createdAt.toDate();
      const dateKey = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const count = session.attendees ? session.attendees.length : 0;
      
      // Accumulate counts if there are multiple sessions on one day
      if (dataMap[dateKey]) {
        dataMap[dateKey] += count;
      } else {
        dataMap[dateKey] = count;
      }
    });

    // 4. Convert Object to Array for Recharts
    const result = Object.keys(dataMap).map(date => ({
      date,
      students: dataMap[date]
    }));

    return result;
  }, [sessions, viewMode]);


  // --- 3. Stats Calculations ---
  const totalClasses = sessions.length;
  const totalAttendanceRecords = sessions.reduce((acc, curr) => acc + curr.attendees.length, 0);
  const avgAttendees = totalClasses > 0 ? Math.round(totalAttendanceRecords / totalClasses) : 0;

  // --- 4. Handle Expand (Fetch Names) ---
  const handleToggleSession = async (sessionId: string, attendeeIds: string[]) => {
    // Collapse if already open
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
      return;
    }
    setExpandedSessionId(sessionId);

    // If no students attended, we don't need to fetch names
    if (attendeeIds.length === 0) return;

    // Filter out IDs we have already fetched to save bandwidth
    const missingIds = attendeeIds.filter(id => !studentNames[id]);
    if (missingIds.length === 0) return;

    setLoadingNames(true);
    const newNames: Record<string, string> = {};

    try {
      // Fetch user documents in parallel
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
      // Merge new names into existing state
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

      {/* --- STATS GRID --- */}
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

      {/* --- CHART SECTION --- */}
      <div className="dashboard-grid" style={{marginBottom: '20px'}}>
        <Card title="Attendance Trends">
          {/* Chart Header with Toggle */}
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <p style={{color: '#94a3b8', fontSize: '0.9rem', margin: 0}}>
              {viewMode === 'month' ? 'Last 30 Days' : 'Last 6 Months'}
            </p>
            <div className="toggle-group" style={{background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px'}}>
              <button 
                onClick={() => setViewMode('month')}
                style={{
                  background: viewMode === 'month' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  color: viewMode === 'month' ? '#818cf8' : '#64748b',
                  border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500
                }}
              >
                Month
              </button>
              <button 
                onClick={() => setViewMode('semester')}
                style={{
                  background: viewMode === 'semester' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  color: viewMode === 'semester' ? '#818cf8' : '#64748b',
                  border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500
                }}
              >
                Semester
              </button>
            </div>
          </div>

          {/* The Chart */}
          <div style={{ width: '100%', height: 300 }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    tick={{fill: '#64748b', fontSize: 12}} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    tick={{fill: '#64748b', fontSize: 12}} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#818cf8' }}
                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="students" 
                    stroke="#818cf8" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorStudents)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b'}}>
                No attendance data found for this period.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* --- SESSION LIST --- */}
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

                  {/* Expanded Student List */}
                  {expandedSessionId === session.id && (
                    <div className="session-details mount-fade">
                      {loadingNames ? (
                        <p style={{fontSize: '0.9rem', color: '#94a3b8'}}>Loading names...</p>
                      ) : session.attendees.length === 0 ? (
                        <p style={{fontSize: '0.9rem', color: '#94a3b8'}}>No students scanned this code.</p>
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