import sidebarConfig from "../configs/sideconfig";
import "../styles/sidebar.css";

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
    </div>
  );
}

export default Sidebar;
