import "../styles/header.css";
import logo from "../assets/lloyds-logo.jpg";

function Header({ onLogout, onToggleSidebar }) {
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
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Header;
