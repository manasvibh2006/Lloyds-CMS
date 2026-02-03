import { useState } from "react";
import axios from "axios";
import "../styles/login.css";

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");

    if (!username || !password || !role) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        username,
        password,
        role
      });

      if (response.data.success) {
        onLogin(response.data.user);
      }
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Login failed. Please try again.");
      }
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        {/* Title */}
        <div className="login-header">
          <h1 className="login-title">Lloyds CMS</h1>
          <p className="login-subtitle">Camp Management System</p>
        </div>

        {/* Form Fields */}
        <div className="login-form-group">
          <label className="login-label">Username</label>
          <input
            type="text"
            className="login-input"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>

        <div className="login-form-group">
          <label className="login-label">Password</label>
          <input
            type="password"
            className="login-input"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>

        <div className="login-form-group">
          <label className="login-label">Role</label>
          <input
            type="text"
            className="login-input"
            placeholder="Enter your role (e.g., admin, manager, staff)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>

        {/* Error Message */}
        {error && <div className="login-error">{error}</div>}

        {/* Login Button */}
        <button
          className="login-button"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Footer Text */}
        <p className="login-footer">
          Please contact your administrator if you need access
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
