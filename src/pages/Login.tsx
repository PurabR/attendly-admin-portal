import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import logoImage from '../images/logo.png'; // Make sure this path is correct

// --- Firebase Imports ---
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Make sure this path is correct

function Login() {
  // --- State ---
  const [email, setEmail] = useState<string>(''); // Changed from username
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [remember, setRemember] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false); // Added for better UX

  const navigate = useNavigate();

  // --- New Firebase Login Handler ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true); // Start loading

    // Check if fields are empty
    if (!email || !password) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    try {
      // Call Firebase to sign in
      await signInWithEmailAndPassword(auth, email, password);

      // Note: Firebase handles session persistence ("remember me") by default.
      // We can add more advanced logic for this later if needed.
      
      navigate('/dashboard'); // Navigate to the dashboard on success

    } catch (firebaseError: any) {
      // Catch and display Firebase errors
      console.error('Firebase login error:', firebaseError.code);
      if (firebaseError.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (firebaseError.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError('Failed to log in. Please try again later.');
      }
    } finally {
      setLoading(false); // Stop loading in any case
    }
  };

  return (
    <div className="auth-page">
      <div className="gradient-bg" />
      <div className="auth-grid">
        <section className="auth-hero">
          <div className="logo-container mount-fade">
            <img
              src={logoImage}
              alt="University of Gauhati"
              className="university-logo"
            />
          </div>
          <div className="brand-badge">Attendly</div>
          <h1 className="hero-title">
            Welcome back, Professor
          </h1>
          <p className="hero-subtitle">
            Sign in to manage attendance, tasks, and insights — all in one place.
          </p>
          <div className="hero-highlights">
            <div className="chip">Real‑time attendance</div>
            <div className="chip">Smart analytics</div>
            <div className="chip">Task tracking</div>
          </div>
        </section>

        <section className="auth-card">
          <form className="login-form" onSubmit={handleLogin}>
            <h2 className="form-title">Sign in</h2>

            {/* --- Email Field (Changed from Username) --- */}
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrap">
                <input
                  type="email" // Changed
                  id="email" // Changed
                  placeholder="Enter your email" // Changed
                  value={email} // Changed
                  onChange={(e) => setEmail(e.target.value)} // Changed
                  autoComplete="email" // Changed
                  required
                />
              </div>
            </div>

            {/* --- Password Field (Unchanged) --- */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={loading} // Disable button while loading
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* --- Form Row (Remember me is not fully wired up) --- */}
            <div className="form-row">
              <label className="remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <a className="link-muted" href="#" onClick={(e) => e.preventDefault()}>
                Forgot password?
              </a>
            </div>

            {error && <p className="error-message" role="alert">{error}</p>}

            {/* --- Submit Button --- */}
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Signing in...' : 'Continue'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default Login;