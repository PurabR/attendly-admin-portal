import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css'; // Reuse your existing styles
import logoImage from '../images/logo.png';

// --- Firebase Imports ---
import { createUserWithEmailAndPassword } from 'firebase/auth'; // For creating the account
import { doc, setDoc, Timestamp } from 'firebase/firestore'; // For saving the profile
import { auth, db } from '../firebaseConfig';

function Register() {
  // --- Form State ---
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('Computer Science'); // Default selection

  // --- UI State ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 1. Basic Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      // 2. Create the User in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Create the User Profile in Firestore
      // We use 'setDoc' to specify the ID. We want the Document ID to match the Auth UID.
      await setDoc(doc(db, "users", user.uid), {
        name: fullName,
        email: email,
        role: "professor", // Important: This marks them as a professor
        department: department,
        createdAt: Timestamp.now()
      });

      console.log("Professor registered:", user.uid);
      
      // 4. Redirect to Dashboard
      navigate('/dashboard');

    } catch (firebaseError: any) {
      console.error("Registration error:", firebaseError);
      if (firebaseError.code === 'auth/email-already-in-use') {
        setError('That email is already registered.');
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="gradient-bg" />
      <div className="auth-grid">
        {/* Reuse the same hero section for consistency */}
        <section className="auth-hero">
          <div className="logo-container mount-fade">
            <img src={logoImage} alt="Logo" className="university-logo" />
          </div>
          <div className="brand-badge">Attendly</div>
          <h1 className="hero-title">Join the Faculty</h1>
          <p className="hero-subtitle">
            Create your professor account to start managing attendance and tasks digitally.
          </p>
        </section>

        <section className="auth-card">
          <form className="login-form" onSubmit={handleRegister}>
            <h2 className="form-title">Create Account</h2>

            {/* --- Full Name --- */}
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <div className="input-wrap">
                <input
                  type="text"
                  id="name"
                  placeholder="e.g. Dr. A. Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* --- Department Selection --- */}
            <div className="form-group">
              <label htmlFor="dept">Department</label>
              <div className="input-wrap">
                <select 
                  id="dept" 
                  value={department} 
                  onChange={(e) => setDepartment(e.target.value)}
                  style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd'}}
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Electronics">Electronics</option>
                </select>
              </div>
            </div>

            {/* --- Email --- */}
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrap">
                <input
                  type="email"
                  id="email"
                  placeholder="professor@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* --- Password --- */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrap">
                <input
                  type="password"
                  id="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* --- Confirm Password --- */}
            <div className="form-group">
              <label htmlFor="confirm">Confirm Password</label>
              <div className="input-wrap">
                <input
                  type="password"
                  id="confirm"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && <p className="error-message" role="alert">{error}</p>}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Creating Account...' : 'Register'}
            </button>

            <div className="form-row" style={{justifyContent: 'center', marginTop: '20px'}}>
              <span style={{color: '#64748b'}}>Already have an account? </span>
              <Link to="/" style={{color: '#6366f1', fontWeight: '600', marginLeft: '5px'}}>
                Sign in
              </Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

export default Register;