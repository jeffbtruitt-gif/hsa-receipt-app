import React, { useState } from 'react';

function LoginPage({ onLogin, error, loading }) {
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password || loading) return;
    onLogin(password, remember);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img src="/logo.png" alt="HSA Receipt Vault" className="login-logo" />
        <p>Secure Financial Records</p>
        <form onSubmit={handleSubmit} method="post" action="#" autoComplete="on">
          {/* Hidden username so iOS/Android password managers can save and autofill this login */}
          <input
            type="text"
            name="username"
            autoComplete="username"
            value="hsa-vault"
            readOnly
            hidden
          />
          <input
            type="password"
            name="password"
            id="password"
            placeholder="Enter password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <label className="remember-me">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span>Keep me signed in on this device</span>
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Login'}
          </button>
          {error && <p className="error">{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
