import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginAdmin(username, password);
      toast.success('Welcome back, Administrator');
      navigate('/admin');
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Login failed. Please check your credentials.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      {/* Animated background shapes */}
      <div style={styles.bgShapesContainer} aria-hidden="true">
        <div style={{ ...styles.bgShape, ...styles.bgShape1 }} />
        <div style={{ ...styles.bgShape, ...styles.bgShape2 }} />
        <div style={{ ...styles.bgShape, ...styles.bgShape3 }} />
        <div style={{ ...styles.bgShape, ...styles.bgShape4 }} />
      </div>

      {/* Subtle grid overlay */}
      <div style={styles.gridOverlay} aria-hidden="true" />

      {/* Main content */}
      <div style={styles.contentWrapper}>
        {/* Logo / Brand */}
        <div style={styles.brandSection}>
          <div style={styles.logoIcon}>
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="40" height="40" rx="10" fill="url(#logoGrad)" />
              <path
                d="M12 20.5L17.5 26L28 15"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3b82f6" />
                  <stop offset="1" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="gradient-text" style={styles.brandName}>
            VoteSync Pro
          </h1>
          <p style={styles.brandTagline}>Administrative Control Panel</p>
        </div>

        {/* Glass card */}
        <div className="glass" style={styles.card}>
          {/* Card header */}
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Sign in to your account</h2>
            <p style={styles.cardSubtitle}>
              Enter your administrator credentials to continue
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div style={styles.errorBox}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.5" />
                <path d="M8 4.5V8.5M8 10.5V11" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span style={styles.errorText}>{error}</span>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="admin-username">
                Username
              </label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M9 9C10.6569 9 12 7.65685 12 6C12 4.34315 10.6569 3 9 3C7.34315 3 6 4.34315 6 6C6 7.65685 7.34315 9 9 9Z"
                      stroke="#94a3b8"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M3 15C3 12.7909 5.68629 11 9 11C12.3137 11 15 12.7909 15 15"
                      stroke="#94a3b8"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input"
                  placeholder="Enter your username"
                  style={styles.inputField}
                  required
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="admin-password">
                Password
              </label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect
                      x="3.75"
                      y="8.25"
                      width="10.5"
                      height="7.5"
                      rx="1.5"
                      stroke="#94a3b8"
                      strokeWidth="1.4"
                    />
                    <path
                      d="M6 8.25V5.25C6 3.59315 7.34315 2.25 9 2.25C10.6569 2.25 12 3.59315 12 5.25V8.25"
                      stroke="#94a3b8"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="Enter your password"
                  style={styles.inputField}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.togglePasswordBtn}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M2.25 2.25L15.75 15.75" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" />
                      <path d="M7.05 7.10999C6.3975 7.77749 6 8.69249 6 9C6 10.6575 7.3425 12 9 12C9.3075 12 9.97499 11.6025 10.6425 10.95" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" />
                      <path d="M3 9C3.75 6.75 6.15 4.5 9 4.5C11.85 4.5 14.25 6.75 15 9C14.25 11.25 11.85 13.5 9 13.5C6.15 13.5 3.75 11.25 3 9Z" stroke="#94a3b8" strokeWidth="1.4" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M3 9C3.75 6.75 6.15 4.5 9 4.5C11.85 4.5 14.25 6.75 15 9C14.25 11.25 11.85 13.5 9 13.5C6.15 13.5 3.75 11.25 3 9Z" stroke="#94a3b8" strokeWidth="1.4" />
                      <circle cx="9" cy="9" r="2.25" stroke="#94a3b8" strokeWidth="1.4" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className="btn btn-primary"
              style={styles.submitBtn}
            >
              {loading ? (
                <>
                  <svg
                    style={styles.spinner}
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                  >
                    <circle
                      cx="9"
                      cy="9"
                      r="7"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="2"
                    />
                    <path
                      d="M9 2C13.4183 2 16 5.58172 16 9"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M3.75 9H14.25M14.25 9L10.5 5.25M14.25 9L10.5 12.75"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={styles.divider}>
            <div style={styles.dividerLine} />
          </div>

          {/* Footer link */}
          <div style={styles.footerLink}>
            <Link to="/" style={styles.backLink}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M10 12L6 8L10 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>

        {/* Security note */}
        <p style={styles.securityNote}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <path
              d="M7 1.16666L2.33334 3.49999V6.41666C2.33334 9.56249 4.27001 12.4833 7 13.4167C9.73001 12.4833 11.6667 9.56249 11.6667 6.41666V3.49999L7 1.16666Z"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Secured with end-to-end encryption
        </p>
      </div>

      {/* Inline keyframes for animations */}
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-40px, 20px) rotate(-120deg); }
          66% { transform: translate(20px, -40px) rotate(-240deg); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(25px, -35px) scale(1.1); }
        }
        @keyframes float4 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, 25px) scale(0.9); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 50%, #7e22ce 100%)',
    position: 'relative',
    overflow: 'hidden',
    padding: '1.5rem',
  },

  /* Animated background shapes */
  bgShapesContainer: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  bgShape: {
    position: 'absolute',
    borderRadius: '50%',
    opacity: 0.07,
    background: 'white',
  },
  bgShape1: {
    width: '400px',
    height: '400px',
    top: '-10%',
    right: '-5%',
    animation: 'float1 20s ease-in-out infinite',
  },
  bgShape2: {
    width: '300px',
    height: '300px',
    bottom: '-8%',
    left: '-5%',
    animation: 'float2 25s ease-in-out infinite',
  },
  bgShape3: {
    width: '200px',
    height: '200px',
    top: '40%',
    left: '10%',
    animation: 'float3 18s ease-in-out infinite',
  },
  bgShape4: {
    width: '150px',
    height: '150px',
    top: '20%',
    right: '15%',
    background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
    opacity: 0.08,
    animation: 'float4 22s ease-in-out infinite',
  },

  /* Grid overlay */
  gridOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundImage:
      'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
    backgroundSize: '60px 60px',
    pointerEvents: 'none',
  },

  /* Content */
  contentWrapper: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    maxWidth: '420px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    animation: 'fadeInUp 0.6s ease-out',
  },

  /* Brand */
  brandSection: {
    textAlign: 'center',
    marginBottom: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
  logoIcon: {
    marginBottom: '0.25rem',
    filter: 'drop-shadow(0 4px 12px rgba(59, 130, 246, 0.4))',
  },
  brandName: {
    fontSize: '1.875rem',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    margin: 0,
    lineHeight: 1.2,
  },
  brandTagline: {
    fontSize: '0.875rem',
    color: 'rgba(255, 255, 255, 0.6)',
    margin: 0,
    fontWeight: 400,
    letterSpacing: '0.02em',
  },

  /* Card */
  card: {
    width: '100%',
    borderRadius: '1rem',
    padding: '2rem',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
  },

  /* Card header */
  cardHeader: {
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 0.375rem 0',
  },
  cardSubtitle: {
    fontSize: '0.8125rem',
    color: '#64748b',
    margin: 0,
  },

  /* Error box */
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    marginBottom: '1.25rem',
  },
  errorText: {
    fontSize: '0.8125rem',
    color: '#dc2626',
    lineHeight: 1.4,
  },

  /* Form */
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  },
  label: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: '#334155',
    letterSpacing: '0.01em',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: 1,
  },
  inputField: {
    paddingLeft: '2.5rem',
    paddingRight: '2.5rem',
    height: '2.75rem',
  },
  togglePasswordBtn: {
    position: 'absolute',
    right: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2rem',
    height: '2rem',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    borderRadius: '0.375rem',
    transition: 'background 0.15s ease',
    zIndex: 1,
  },

  /* Submit button */
  submitBtn: {
    width: '100%',
    height: '2.75rem',
    fontSize: '0.9375rem',
    fontWeight: 600,
    marginTop: '0.25rem',
    letterSpacing: '0.01em',
  },

  /* Spinner */
  spinner: {
    animation: 'spin 0.8s linear infinite',
  },

  /* Divider */
  divider: {
    margin: '1.5rem 0',
  },
  dividerLine: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent, #e2e8f0, transparent)',
  },

  /* Footer */
  footerLink: {
    textAlign: 'center',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: '#3b82f6',
    textDecoration: 'none',
    transition: 'color 0.15s ease',
  },

  /* Security note */
  securityNote: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.375rem',
    marginTop: '1.5rem',
    fontSize: '0.75rem',
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: 400,
  },
};
