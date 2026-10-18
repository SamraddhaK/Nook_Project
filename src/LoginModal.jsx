/*
 * LoginModal.jsx
 * The sign-up / log-in popup. It only collects and validates the form;
 * App.jsx decides what "signing in" means (see handleAuth there).
 */
import { useEffect, useState } from 'react';
import { MagnifierOwl, PINE_PATH, CloseIcon } from './components/Illustrations';

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function LoginModal({ initialTab = 'signup', scene, onClose, onSubmit }) {
  const [tab, setTab] = useState(initialTab);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const isSignup = tab === 'signup';

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const switchTab = (next) => {
    setTab(next);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = form.email.trim().toLowerCase();
    if (isSignup && !form.name.trim()) return setError('What should Nook call you? Add a first name.');
    if (!EMAIL_PATTERN.test(email)) return setError('That email doesn’t look quite right.');
    if (form.password.length < 6) return setError('Passwords need at least 6 characters.');
    /*const problem = onSubmit(tab, { name: form.name.trim(), email, password: form.password });
    if (problem) setError(problem);*/
    try {
      setError('');
      const problem = await onSubmit(tab, {
        name: form.name.trim(),
        email,
        password: form.password,
      });

      if (problem) setError(problem);
    } catch (error) {
      setError(error.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="overlay overlay-top" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="login card pop" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <div className="login-art hide-sm" style={{ background: scene.midSky }}>
          <svg viewBox="0 0 360 560" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
            <g opacity={scene.starOpacity} fill="#F9E4C5">
              <circle className="twinkle" cx="50" cy="70" r="2" />
              <circle cx="150" cy="40" r="1.5" />
              <circle className="twinkle" cx="300" cy="110" r="1.8" />
              <circle cx="90" cy="180" r="1.4" />
              <circle cx="230" cy="200" r="1.6" />
            </g>
            <circle cx="270" cy={scene.loginSunY} r="40" fill={scene.sun} opacity={scene.sunOpacity} />
            <g opacity={scene.moonOpacity}>
              <circle cx="90" cy="120" r="30" fill="#F9E4C5" />
              <circle cx="103" cy="110" r="27" fill={scene.midSky} />
            </g>
            <path d="M0 360L110 230L190 320L260 250L360 350V560H0Z" fill={scene.mount} />
            <path d="M0 420Q100 360 200 410T360 390V560H0Z" fill={scene.hill} />
            <path transform="translate(24 350) scale(.8)" d={PINE_PATH} fill={scene.pineB} />
            <path transform="translate(290 330) scale(.95)" d={PINE_PATH} fill={scene.pineB} />
            <path d="M0 480Q120 440 360 470V560H0Z" fill={scene.front} />
            <MagnifierOwl x="70" y="290" width="220" height="191" />
          </svg>
          <div className="note card-s fill-peach login-note">
            {isSignup ? 'your own cozy corner, saved' : 'welcome back to the nook'}
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <button type="button" className="close-btn" aria-label="Close" onClick={onClose}><CloseIcon /></button>

          <div className="tabs" role="tablist" aria-label="Account">
            <button type="button" role="tab" aria-selected={!isSignup} className={!isSignup ? 'is-on' : ''} onClick={() => switchTab('login')}>Log in</button>
            <button type="button" role="tab" aria-selected={isSignup} className={isSignup ? 'is-on' : ''} onClick={() => switchTab('signup')}>Sign up</button>
          </div>

          
          <h2 id="auth-title" className="login-title">
            {isSignup ? 'Make yourself a nook.' : 'Welcome back.'}
          </h2>

          <p className="muted">
            {isSignup ? 'Save your game journal, progress reports and favorite time of day.' : 'Log in to pick up your journal right where you left it.'}
          </p>

          {isSignup && (
            <label className="field">
              What should Nook call you?
              <input type="text" autoComplete="given-name" placeholder="Your first name" value={form.name} onChange={update('name')} />
            </label>
          )}
          <label className="field">
            Email
            <input type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={update('email')} />
          </label>
          <label className="field">
            Password
            <span className="password-box">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                placeholder="At least 6 characters"
                value={form.password}
                onChange={update('password')}
              />
              <button type="button" className="link-btn" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((s) => !s)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </span>
          </label>

          {error && <p className="form-error" role="alert">{error}</p>}

          
          <button type="submit" className="btn btn-block">
            {isSignup ? 'Create my account →' : 'Log in →'}
          </button>

          <div className="divider"><span />or<span /></div>
          <button type="button" className="btn-guest" onClick={onClose}>Look around as a guest</button>
          <p className="fine-print">Prototype: your profile and journal save on this device only, and passwords are never stored. The real version signs you in through a secure server.</p>
        </form>
      </div>
    </div>
  );
}
