import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import our layout and pages
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Tasks from './pages/Tasks';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route 1: The Login Page 
          This is now the default page for "/" and "/login"
        */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* Route 2: The "Logged In" pages 
          These are now all grouped under the "/dashboard" path.
        */}
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<Dashboard />} /> {/* Now at /dashboard */}
          <Route path="attendance" element={<Attendance />} /> {/* Now at /dashboard/attendance */}
          <Route path="tasks" element={<Tasks />} /> {/* Now at /dashboard/tasks */}
        </Route>
        
        {/* A fallback for any other URL */}
        <Route path="*" element={<div>Page Not Found</div>} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;