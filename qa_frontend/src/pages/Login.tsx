import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import { api } from '../api';
import '../styles/Login.css';

export default function Login() {
  const navigate = useNavigate();
  
  // State variables
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.login({ email, password });
      
      // Save credentials in localStorage
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('login_time', Date.now().toString());
      
      // Navigate to main dashboard
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Split container */}
      <div className="auth-split-wrapper">
        
        {/* LEFT CARD COLUMN - Login Form */}
        <div className="auth-form-column">
          {/* Logo Brand Header */}
          <div className="auth-logo-header">
            <div className="auth-logo-box">
              {/* Custom logo representing play/brackets */}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="m10 8 4 4-4 4" />
              </svg>
            </div>
            <div className="auth-logo-text">
              <h2 className="auth-logo-title">
                TestOps
              </h2>
              <span className="auth-logo-sub">Continuous Quality Platform</span>
            </div>
          </div>

          {/* Form card */}
          <div className="auth-card">
            <div className="auth-card-header">
              <h1 className="auth-card-title">Sign in to your account</h1>
              <p className="auth-card-subtitle">Welcome back! Please enter your details.</p>
            </div>

            {error && (
              <div className="auth-error-alert">
                <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '1rem', width: '1rem', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Email field */}
              <div className="auth-input-group">
                <label className="auth-input-label">Email Address</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="engineer@company.com"
                    className="auth-input-field"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="auth-input-group">
                <div className="auth-input-label-row">
                  <label className="auth-input-label">Password</label>
                  <a href="#forgot" className="auth-forgot-link">Forgot password?</a>
                </div>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="auth-input-field"
                  />
                </div>
              </div>

              {/* Remember me checkbox */}
              <div className="auth-checkbox-row">
                <label className="auth-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="auth-checkbox-input"
                  />
                  <span className="auth-checkbox-text">Remember me</span>
                </label>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="auth-submit-btn"
              >
                {loading ? (
                  <span style={{ display: 'inline-block', height: '1rem', width: '1rem', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <LogIn size={15} />
                  </>
                )}
              </button>
            </form>

            {/* Social logins */}
            <div className="auth-divider">
              <div className="auth-divider-line">
                <div className="auth-divider-border"></div>
              </div>
              <div className="auth-divider-text-container">
                <span className="auth-divider-text">Or continue with</span>
              </div>
            </div>

            <div className="social-grid">
              <button className="social-btn">
                <svg className="google-icon" style={{ height: '1rem', width: '1rem' }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.86-4.53-6.16-4.53z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <span>Google</span>
              </button>
              <button className="social-btn">
                <svg className="github-icon" style={{ height: '1rem', width: '1rem' }} viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.008.069-.008 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                <span>GitHub</span>
              </button>
            </div>

            {/* Route redirect */}
            <div className="auth-redirect-container">
              <span className="auth-redirect-text">
                New to the platform?{' '}
                <Link to="/register" className="auth-redirect-link">
                  Create an account
                </Link>
              </span>
            </div>
          </div>

          {/* Footer branding links */}
          <div className="auth-footer-branding">
            <a href="#terms" className="auth-footer-link">Terms of Service</a>
            <span>•</span>
            <a href="#privacy" className="auth-footer-link">Privacy Policy</a>
            <span>•</span>
            <a href="#contact" className="auth-footer-link">Contact Support</a>
          </div>
        </div>

        {/* RIGHT COLUMN - Glowing illustration (Visible on desktop) */}
        <div className="illustration-column">
          {/* Glowing Radial Starburst effect using nested elements */}
          <div className="glowing-starburst"></div>
          <div className="glowing-center"></div>
          
          {/* Central glowing icon container */}
          <div className="illustration-content">
            <div className="illustration-card">
              <div className="illustration-gradient-box">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="m10 8 4 4-4 4" />
                </svg>
              </div>
            </div>
            <h3 className="illustration-title">Enterprise QA Orchestration</h3>
            <p className="illustration-text">
              Experience the power of real-time logging, automated suite isolation, and dynamic performance trends in one platform.
            </p>
          </div>

          {/* Decorative small stars/dots in corners */}
          <div className="decorative-dot-1"></div>
          <div className="decorative-dot-2"></div>
          <div className="decorative-dot-3"></div>
        </div>

      </div>
    </div>
  );
}
