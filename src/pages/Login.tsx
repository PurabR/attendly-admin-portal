import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const ADMIN_USERNAME = 'admin';
  const ADMIN_PASSWORD = 'password';

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [remember, setRemember] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setError('');
      if (remember) {
        try {
          localStorage.setItem('attendly-last-user', username);
        } catch {}
      }
      navigate('/Dashboard');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="auth-page">
      <div className="gradient-bg" />
      <div className="auth-grid">
        <section className="auth-hero">
          <div className="brand-badge">Attendly</div>
          <h1 className="hero-title">
            Welcome back, Teacher
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

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <div className="input-wrap">
                <input
                  type="text"
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

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
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

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

            <button type="submit" className="login-button">
              Continue
            </button>

            
          </form>
        </section>
      </div>
    </div>
  );
}

export default Login;