import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Import the new styles

function Login() {
  // --- Hardcoded Admin Credentials ---
  const ADMIN_USERNAME = 'admin';
  const ADMIN_PASSWORD = 'password';

  // --- State Hooks ---
  // To store what the user is typing
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  // To show an error message
  const [error, setError] = useState<string>('');

  // --- Navigation Hook ---
  // This allows us to redirect the user
  const navigate = useNavigate();

  // --- Form Submit Handler ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent the form from refreshing the page

    // Check if the credentials match
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Success!
      setError('');
      console.log('Login successful');
      
      // Navigate to the Dashboard (which is our "home page")
      navigate('/Dashboard'); 

    } else {
      // Failure
      setError('Invalid username or password');
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Teacher Portal Login</h2>
        
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* Show error message if it exists */}
        {error && <p className="error-message">{error}</p>}
        
        <button type="submit" className="login-button">
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;