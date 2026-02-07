import { useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

function DashboardLayout({ children, onLogout, setActivePage, activePage}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      
      {/* HEADER WITH LOGO */}
      <Header onLogout={onLogout} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* BODY */}
      <div className="app-body">
        {/* SIDEBAR */}
        <Sidebar 
          active={activePage} 
          onChange={setActivePage}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* MAIN CONTENT */}
        <div className="main-content-area">
          {children}
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
