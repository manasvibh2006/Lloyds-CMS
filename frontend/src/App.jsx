import { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./Layouts/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import BookingPage from "./pages/BookingPage";
import UserInputPage from "./pages/UserInputPage";
import AllocationList from "./components/AllocationList";
import ReportPage from "./pages/ReportPage";
import CampPage from "./pages/CampPage";
import SettingsPage from "./pages/SettingsPage";
import api from "./services/api";



function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [allocations, setAllocations] = useState([]);

  console.log("App rendered, currentUser:", currentUser);

  // booking flow
  const [bookingStep, setBookingStep] = useState("BOOKING");
  const [bookingData, setBookingData] = useState(null);

  // Fetch allocations
  const fetchAllocations = async () => {
    if (!currentUser) return;

    try {
      const response = await api.get("/allocations");
      setAllocations(response.data);
    } catch (err) {
      console.error("Allocation fetch error:", err);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, [currentUser, activePage]);

  const handleDeleteAllocation = (deletedId) => {
    // If deletedId is provided, optimistically update the UI
    if (deletedId) {
      setAllocations(prev => prev.filter(alloc => alloc.id !== deletedId));
    }
    // Always refetch to ensure sync
    fetchAllocations();
  };

  // login gate
  if (!currentUser) {
    return <LoginPage onLogin={setCurrentUser} />;
  }

  return (
    <DashboardLayout
      activePage={activePage}
      setActivePage={(page) => {
        setActivePage(page);
        if (page === "booking") {
          setBookingStep("BOOKING");
          setBookingData(null);
        }
      }}
      onLogout={() => setCurrentUser(null)}
      currentUser={currentUser}
    >
      {activePage === "dashboard" && (
        <DashboardPage onNavigate={(page) => setActivePage(page)} />
      )}

      {activePage === "booking" && bookingStep === "BOOKING" && (
        <BookingPage
          onNavigate={(page) => setActivePage(page)}
          onProceed={(data) => {
            setBookingData(data);
            setBookingStep("USER");
          }}
        />
      )}

      {activePage === "booking" && bookingStep === "USER" && (
        <UserInputPage
          bookingData={bookingData}
          onSuccess={() => {
            // UserInputPage handles the API call, just move to allocation view
            setActivePage("allocation");
            // Refresh allocations
            fetchAllocations();
          }}
        />
      )}

      {activePage === "allocation" && (
        <AllocationList allocations={allocations} onRefresh={fetchAllocations} onDelete={handleDeleteAllocation} />
      )}

      {activePage === "allocations" && (
        <AllocationList allocations={allocations} onRefresh={fetchAllocations} onDelete={handleDeleteAllocation} />
      )}

      {activePage === "reports" && (
        <ReportPage onNavigate={(page) => setActivePage(page)} />
      )}

      {activePage === "camps" && (
        <CampPage onNavigate={(page) => setActivePage(page)} />
      )}

      {activePage === "settings" && (
        <SettingsPage />
      )}
    </DashboardLayout>
  );
}

export default App;
