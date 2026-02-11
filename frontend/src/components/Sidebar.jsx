import sidebarConfig from "../configs/sideconfig";
import "../styles/sidebar.css";
import { FaCog, FaCopyright } from "react-icons/fa";

function Sidebar({ active, onChange, isOpen, onToggle }) {
  return (
    <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <button className="sidebar-toggle" onClick={onToggle} title="Toggle Sidebar">
        {isOpen ? "◀" : "▶"}
      </button>

      {isOpen && <div className="sidebar-title">CAMPUS</div>}

      <ul className="sidebar-list">
        {sidebarConfig.map((item) => {
          const Icon = item.icon;

          return (
            <li
              key={item.path}
              className={`sidebar-item ${active === item.path ? "active" : ""}`}
              onClick={() => onChange(item.path)}
              title={!isOpen ? item.label : ""}
            >
              <Icon className="sidebar-icon" />
              {isOpen && <span className="sidebar-label">{item.label}</span>}
            </li>
          );
        })}
      </ul>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div 
          className={`sidebar-item sidebar-settings ${active === "settings" ? "active" : ""}`}
          onClick={() => onChange("settings")}
          title={!isOpen ? "Settings" : ""}
        >
          <FaCog className="sidebar-icon" />
          {isOpen && <span className="sidebar-label">Settings</span>}
        </div>
        
        {isOpen && (
          <div className="sidebar-copyright">
            <FaCopyright className="copyright-icon" />
            <span>2026 Lloyds CMS</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
