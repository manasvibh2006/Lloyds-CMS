import { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./Layouts/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import BookingPage from "./pages/BookingPage";
import UserInputPage from "./pages/UserInputPage";
import AllocationList from "./components/AllocationList";
import ReportPage from "./pages/ReportPage";
import BlockPage from "./pages/blockPage";



function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [allocations, setAllocations] = useState([]);

  console.log("App rendered, currentUser:", currentUser);

  // booking flow
  const [bookingStep, setBookingStep] = useState("BOOKING");
  const [bookingData, setBookingData] = useState(null);

  // Fetch allocations
  useEffect(() => {
    if (currentUser) {
      fetch('http://localhost:5000/api/allocations')
        .then(res => res.json())
        .then(data => setAllocations(data))
        .catch(err => console.error('Allocation fetch error:', err));
    }
  }, [currentUser, activePage]);

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
            fetch('http://localhost:5000/api/allocations')
              .then(res => res.json())
              .then(data => setAllocations(data))
              .catch(err => console.error('Allocation fetch error:', err));
          }}
        />
      )}

      {activePage === "allocation" && (
        <AllocationList allocations={allocations} />
      )}

      {activePage === "allocations" && (
        <AllocationList allocations={allocations} />
      )}

      {activePage === "reports" && (
        <ReportPage onNavigate={(page) => setActivePage(page)} />
      )}

      {activePage === "blocks" && (
        <BlockPage onNavigate={(page) => setActivePage(page)} />
      )}
    </DashboardLayout>
  );
}

export default App;
