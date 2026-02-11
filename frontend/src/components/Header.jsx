import { useState } from "react";
import "../styles/header.css";
import logo from "../assets/lloyds-logo.jpg";

function Header({ onLogout, onToggleSidebar, currentUser }) {
  const [showUserDetails, setShowUserDetails] = useState(false);

  const formatRole = (role) => {
    if (!role) return "USER";
    return role.toUpperCase().replace("_", " ");
  };

  return (
    <div className="header">
      <div className="header-left">
        <button 
          className="hamburger-btn"
          onClick={onToggleSidebar}
          title="Toggle Sidebar"
        >
          ☰
        </button>
        <img
          src={logo}
          alt="LLOYDS METALS"
          className="logo-full"
          onError={(e) => {
            console.log('Logo failed to load from:', e.target.src);
            e.target.style.opacity = '0';
          }}
        />
      </div>

      <div className="header-right-group">
        <span className="header-cms">Camp Management System</span>
        {currentUser && (
          <div 
            className="user-info"
            onClick={() => setShowUserDetails(!showUserDetails)}
            title="Click to view user details"
          >
            <div className="user-icon">👤</div>
            <div className="user-details">
              {showUserDetails ? (
                <div className="user-name">{currentUser.username}</div>
              ) : (
                <div className="user-role-main">{formatRole(currentUser.role)}</div>
              )}
            </div>
          </div>
        )}
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Header;
