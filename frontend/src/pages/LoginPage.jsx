import { useState } from "react";
import "../styles/login.css";

function LoginPage({ onLogin }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // TEMP USERS (frontend demo only)
  const USERS = [
    { id: "a", password: "1", role: "admin" }
  ];

  const handleLogin = () => {
    setError("");

    if (!userId || !password) {
      setError("Please enter User ID and Password");
      return;
    }

    const user = USERS.find(
      (u) => u.id === userId && u.password === password
    );

    if (!user) {
      setError("Invalid credentials");
      return;
    }

    onLogin(user);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Camp Management System</h2>

        <input
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <div className="login-error">{error}</div>}

        <button onClick={handleLogin}>Login</button>
      </div>
    </div>
  );
}

export default LoginPage;
