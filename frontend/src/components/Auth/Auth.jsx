import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

import { loginUser, registerUser } from '../../services/authService';
import './Auth.css';

function Auth({ mode = 'login', onModeChange, onAuthSuccess }) {
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isLogin = mode === 'login';

  async function handleSubmit(event) {
    event.preventDefault();

    setErrorMessage('');
    setLoading(true);

    try {
      let response;

      if (isLogin) {
        response = await loginUser({
          email,
          password,
        });
      } else {
        response = await registerUser({
          name,
          email,
          password,
        });
      }

      localStorage.setItem(
        'careerforge_token',
        response.access_token
      );

      localStorage.setItem(
        'careerforge_user',
        JSON.stringify(response.user)
      );

      onAuthSuccess?.(response.user);

    } catch (error) {
      console.error('Authentication error:', error);

      const backendMessage =
        error.response?.data?.detail;

      if (backendMessage) {
        setErrorMessage(backendMessage);
      } else {
        setErrorMessage(
          'Unable to connect to the server. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function handleModeChange(newMode) {
    setErrorMessage('');
    setName('');
    setEmail('');
    setPassword('');
    onModeChange?.(newMode);
  }

  return (
    <div className="auth-page">

      {/* Left branding panel */}

      <section className="auth-brand-panel">

        <div className="auth-brand">
          <div className="auth-brand-mark">
            <Sparkles size={20} />
          </div>

          <div>
            <div className="auth-brand-name">
              CareerForge <span>AI</span>
            </div>

            <p>AI-powered career intelligence</p>
          </div>
        </div>

        <div className="auth-message">

          <div className="auth-badge">
            <Sparkles size={13} />
            Your career, intelligently mapped
          </div>

          <h1>
            Turn your
            <span>potential</span>
            into progress.
          </h1>

          <p>
            Understand your strengths, close your skill gaps,
            discover better opportunities, and prepare for what
            comes next.
          </p>

          <div className="auth-benefits">

            <div>
              <CheckCircle2 size={16} />
              <span>AI-powered resume analysis</span>
            </div>

            <div>
              <CheckCircle2 size={16} />
              <span>Personalized career roadmap</span>
            </div>

            <div>
              <CheckCircle2 size={16} />
              <span>Intelligent job matching</span>
            </div>

            <div>
              <CheckCircle2 size={16} />
              <span>Interview, coding & aptitude practice</span>
            </div>

          </div>

        </div>

        <div className="auth-brand-footer">
          Build smarter. Grow faster.
        </div>

      </section>


      {/* Form panel */}

      <section className="auth-form-panel">

        <div className="auth-form-wrapper">

          <div className="mobile-auth-brand">
            <div className="auth-brand-mark">
              <Sparkles size={18} />
            </div>

            <strong>
              CareerForge <span>AI</span>
            </strong>
          </div>


          <div className="auth-heading">

            <span className="auth-small-label">
              {isLogin ? 'WELCOME BACK' : 'GET STARTED'}
            </span>

            <h2>
              {isLogin
                ? 'Welcome back.'
                : 'Create your account.'}
            </h2>

            <p>
              {isLogin
                ? 'Log in to continue your career journey.'
                : 'Start building your personalized career journey.'}
            </p>

          </div>


          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >

            {!isLogin && (
              <div className="form-field">

                <label htmlFor="name">
                  Full name
                </label>

                <input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  required
                />

              </div>
            )}


            <div className="form-field">

              <label htmlFor="email">
                Email address
              </label>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
              />

            </div>


            <div className="form-field">

              <label htmlFor="password">
                Password
              </label>

              <div className="password-input">

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={
                    isLogin
                      ? 'Enter your password'
                      : 'Create a password'
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>

              </div>

            </div>


            {isLogin && (
              <div className="form-extra">

                <label className="remember-me">

                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) =>
                      setRememberMe(event.target.checked)
                    }
                  />

                  <span>Remember me</span>

                </label>

                <button
                  type="button"
                  className="forgot-password"
                >
                  Forgot password?
                </button>

              </div>
            )}


            {!isLogin && (
              <div className="terms-text">
                By creating an account, you agree to our
                <button type="button">
                  Terms of Service
                </button>
                and
                <button type="button">
                  Privacy Policy
                </button>.
              </div>
            )}


            {errorMessage && (
              <div
                style={{
                  marginTop: '4px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: '#fff0f1',
                  border: '1px solid #f3c4c8',
                  color: '#b83e4b',
                  fontSize: '13px',
                  lineHeight: '1.4',
                }}
              >
                {errorMessage}
              </div>
            )}


            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
              style={{
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading
                ? isLogin
                  ? 'Logging in...'
                  : 'Creating account...'
                : isLogin
                  ? 'Log in'
                  : 'Create account'}

              {!loading && <ArrowRight size={16} />}
            </button>

          </form>


          <div className="auth-divider">
            <span>or</span>
          </div>


          <div className="auth-switch">

            <span>
              {isLogin
                ? "Don't have an account?"
                : 'Already have an account?'}
            </span>

            <button
              type="button"
              onClick={() =>
                handleModeChange(
                  isLogin ? 'signup' : 'login'
                )
              }
            >
              {isLogin ? 'Create one' : 'Log in'}
            </button>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Auth;