import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import our layout and pages
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Tasks from './pages/Tasks';
import Register from './pages/Register';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route 1: Public Pages */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Route 2: Protected Pages (Wrapped in Layout) */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/tasks" element={<Tasks />} />
        </Route>

        {/* Route 3: Fallback (Must be INSIDE Routes) */}
        <Route path="*" element={<div style={{color: 'white', padding: '20px'}}>Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;