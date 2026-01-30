import { useState } from "react";

function DashboardLayout({ children, onLogout, setActivePage, activePage}) {
  const [open, setOpen] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      
      {/* TOP BAR */}
      <div
        style={{
          height: "55px",
          backgroundColor: "#2f78c4",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            onClick={() => setOpen(!open)}
            style={{
              marginRight: "12px",
              background: "transparent",
              border: "none",
              color: "white",
              fontSize: "22px",
              cursor: "pointer"
            }}
          >
            ☰
          </button>
          Camp Management System
        </div>

        {/* SETTINGS / LOGOUT */}
        <div style={{ position: "relative" }}>
          <div
            style={{ cursor: "pointer" }}
            onClick={() => setShowMenu(!showMenu)}
          >
            ⚙️
          </div>

          {showMenu && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "40px",
                background: "white",
                color: "#000",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                borderRadius: "4px",
                width: "180px",
                zIndex: 100
              }}
            >
              <div
                style={{ padding: "10px", cursor: "pointer" }}
                onClick={() => alert("Change Password (Backend will handle)")}
              >
                Change Password
              </div>

              <div
                style={{
                  padding: "10px",
                  cursor: "pointer",
                  borderTop: "1px solid #ddd"
                }}
                onClick={onLogout}
              >
                Logout
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, display: "flex" }}>
        
        {/* SIDEBAR */}
       {open && (
  <div
    style={{
      width: "220px",
      backgroundColor: "#1f3b57",
      color: "white",
      padding: "12px",
      flexShrink: 0
    }}
  >
    {[
      { key: "dashboard", label: "Dashboard" },
      { key: "booking", label: "Booking" },
      { key: "block", label: "Block" },
      { key: "room", label: "Room Details" },
      { key: "amenities", label: "Amenities" },
      { key: "guest", label: "Guest" },
      { key: "allocation", label: "Allocation" },
      { key: "reports", label: "Reports" }
    ].map(item => (
      <div
        key={item.key}
        onClick={() => setActivePage(item.key)}
        style={{
          padding: "10px 14px",
          marginBottom: "4px",
          cursor: "pointer",
          borderRadius: "4px",
          backgroundColor:
            activePage === item.key ? "#2f78c4" : "transparent",
          fontWeight:
            activePage === item.key ? "600" : "400"
        }}
        onMouseEnter={(e) =>
          e.currentTarget.style.backgroundColor =
            activePage === item.key ? "#2f78c4" : "#294a6d"
        }
        onMouseLeave={(e) =>
          e.currentTarget.style.backgroundColor =
            activePage === item.key ? "#2f78c4" : "transparent"
        }
      >
        {item.label}
      </div>
    ))}
  </div>
)}




        {/* MAIN CONTENT */}
        <div
          style={{
            flex: 1,
            backgroundColor: "#eaeaea",
            padding: "16px",
            overflow: "auto"
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
