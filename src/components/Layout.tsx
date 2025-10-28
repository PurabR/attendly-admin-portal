import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

// This component will wrap our logged-in pages
function Layout() {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ flexGrow: 1, padding: '20px' }}>
        {/* This Outlet is where our pages (Dashboard, etc.) will be rendered */}
        <Outlet /> 
      </main>
    </div>
  );
}

export default Layout;