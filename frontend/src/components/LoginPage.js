import React, { useState } from 'react';

function LoginPage({ onLogin, error }) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(password);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img src="/logo.png" alt="HSA Receipt Vault" className="login-logo" />
        <p>Secure Financial Records</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <button type="submit">Login</button>
          {error && <p className="error">{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
