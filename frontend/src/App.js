import React, { useState } from 'react';
import './App.css';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';

// Key used to keep the user signed in on this device (e.g. the iPhone home-screen app).
const STORAGE_KEY = 'hsaVault.session';

const readSavedPassword = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) || '';
  } catch (e) {
    return '';
  }
};

const savePassword = (pwd) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, pwd);
  } catch (e) {
    // Storage unavailable (private mode etc.) — fall back to in-memory only.
  }
};

const clearSavedPassword = () => {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // ignore
  }
};

function App() {
  // If this device was remembered, go straight to the dashboard. The dashboard
  // already logs out on a 401, so a changed password still sends you back here.
  const initialPassword = readSavedPassword();
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(initialPassword));
  const [password, setPassword] = useState(initialPassword);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (pwd, remember) => {
    setError('');
    setLoading(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd }),
      });

      if (response.ok) {
        if (remember) {
          savePassword(pwd);
        } else {
          clearSavedPassword();
        }
        setPassword(pwd);
        setIsAuthenticated(true);
      } else {
        setError('Incorrect password');
      }
    } catch (err) {
      setError('Failed to connect to server. It may be waking up — try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearSavedPassword();
    setIsAuthenticated(false);
    setPassword('');
  };

  return (
    <div className="App">
      {!isAuthenticated ? (
        <LoginPage onLogin={handleLogin} error={error} loading={loading} />
      ) : (
        <Dashboard password={password} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
