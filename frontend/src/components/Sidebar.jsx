import { SIDEBAR_ITEMS } from "../configs/sideConfig";
import "../styles/sidebar.css";

function Sidebar({ active, onChange }) {
  return (
    <div className="sidebar">
      <div className="sidebar-title">CAMPUS</div>

      <ul className="sidebar-list">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.Icon;

          return (
            <li
              key={item.key}
              className={`sidebar-item ${active === item.key ? "active" : ""}`}
              onClick={() => onChange(item.key)}
            >
              <Icon className="sidebar-icon" />
              <span className="sidebar-label">{item.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Sidebar;
