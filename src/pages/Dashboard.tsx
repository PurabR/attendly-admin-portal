import React, { useEffect, useRef, useState } from 'react';
import Card from '../components/Card';
import QRCode from 'react-qr-code';
import './Dashboard.css';

function Dashboard() {
  // We explicitly tell TypeScript that 'qrValue' is a string
  const [qrValue, setQrValue] = useState<string>('');
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const countdownRef = useRef<number | null>(null);

  const generateQR = () => {
    // In a real app, you'd call your backend to get a unique token
    const uniqueToken = `CLASS_CS701_TIME_${Date.now()}`;
    setQrValue(uniqueToken);
    setSecondsLeft(30);

    // Clear any existing countdown
    if (countdownRef.current) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    // QR code will auto-expire after 30 seconds and countdown every 1s
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
        }
        return next;
      });
    }, 1000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) window.clearInterval(countdownRef.current);
    };
  }, []);

  return (
    <div className="dashboard-page">
      <div className="gradient-bg" />
      <header className="dashboard-header mount-fade">
        <div>
          <h1 className="dash-title">Welcome back 👋</h1>
          <p className="dash-subtitle">Here’s what’s happening today</p>
        </div>
        <div className="dash-actions">
          <button className="btn primary" onClick={generateQR} disabled={qrValue !== ''}>
            {qrValue ? 'QR Active' : 'Generate QR'}
          </button>
          <button className="btn ghost" onClick={() => alert('Navigate to Tasks page...')}>Assign Task</button>
        </div>
      </header>

      <section className="stats-grid mount-rise">
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
          <button className="btn primary" onClick={generateQR} disabled={qrValue !== ''}>
            {qrValue ? 'QR Code Active…' : 'Generate QR Code'}
          </button>

          <div className="qr-container">
            {qrValue ? (
              <div style={{ textAlign: 'center' }}>
                <div className="qr-wrap mount-rise">
                  <QRCode value={qrValue} size={200} />
                </div>
                <p className="qr-expire">Expires in <span className="countdown">{secondsLeft}</span> seconds</p>
              </div>
            ) : (
              <p className="qr-placeholder">QR code will appear here.</p>
            )}
          </div>
        </Card>

        <Card title="Assign Task">
          <p>Quickly assign a new task or announcement to your classes.</p>
          <button className="btn ghost" onClick={() => alert('Navigate to Tasks page...')}>Assign New Task</button>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;