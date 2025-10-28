import React, { useState } from 'react';
import Card from '../components/Card';
import QRCode from 'react-qr-code';
import './Dashboard.css'; // We'll create this file next

function Dashboard() {
  // We explicitly tell TypeScript that 'qrValue' is a string
  const [qrValue, setQrValue] = useState<string>('');

  const generateQR = () => {
    // In a real app, you'd call your backend to get a unique token
    const uniqueToken = `CLASS_CS701_TIME_${Date.now()}`;
    setQrValue(uniqueToken);

    // QR code will auto-expire after 30 seconds
    setTimeout(() => setQrValue(''), 30000); 
  };

  return (
    <div className="dashboard-container">
      <h2>Teacher's Dashboard</h2>

      <div className="dashboard-grid">
        <Card title="Generate Attendance QR Code">
          <p>Click the button to generate a unique, 30-second QR code for your class.</p>
          <button onClick={generateQR} disabled={qrValue !== ''}>
            {qrValue ? 'QR Code Active...' : 'Generate QR Code'}
          </button>

          <div className="qr-container">
            {qrValue ? (
              <div style={{ textAlign: 'center' }}>
                <QRCode value={qrValue} size={200} />
                <p style={{color: 'red', marginTop: '10px'}}>Expires in 30 seconds</p>
              </div>
            ) : (
              <p>QR code will appear here.</p>
            )}
          </div>
        </Card>

        <Card title="Assign Task">
          <p>Quickly assign a new task or announcement to your classes.</p>
          {/* This would link to the Tasks page or open a modal */}
          <button onClick={() => alert('Navigate to Tasks page...')}>Assign New Task</button>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;