import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./Layouts/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import BookingPage from "./pages/BookingPage";
import UserInputPage from "./pages/UserInputPage";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");

  // booking flow
  const [bookingStep, setBookingStep] = useState("BOOKING");
  const [bookingData, setBookingData] = useState(null);

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
    >
      {activePage === "dashboard" && <DashboardPage />}

      {activePage === "booking" && bookingStep === "BOOKING" && (
        <BookingPage
          onProceed={(data) => {
            setBookingData(data);
            setBookingStep("USER");
          }}
        />
      )}

      {activePage === "booking" && bookingStep === "USER" && (
        <UserInputPage
          booking={bookingData}
          onSubmit={async (userData) => {
            await fetch("http://localhost:5000/api/allocations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...bookingData,
                ...userData
              })
            });

            alert("Booking saved");
            setActivePage("dashboard");
          }}
        />
      )}
    </DashboardLayout>
  );
}

export default App;
