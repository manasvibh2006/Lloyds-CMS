import { useState, useEffect } from "react";
import BookingForm from "../components/BookingForm";
import PageContainer from "../components/PageContainer";
import api from "../services/api";

function BookingPage({ onProceed, onNavigate }) {
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBuildings = async () => {
      try {
        const response = await api.get("/buildings");
        setBuildings(response.data);
        setError(null);
      } catch (err) {
        console.error("Buildings error:", err);
        setError("Failed to load buildings");
      } finally {
        setLoading(false);
      }
    };

    loadBuildings();
  }, []);

  const handleBuildingChange = async (buildingId) => {
    if (!buildingId) {
      setFloors([]);
      setRooms([]);
      setBeds([]);
      return;
    }

    try {
      const response = await api.get("/floors", { params: { buildingId } });
      setFloors(response.data);
    } catch (err) {
      console.error("Floors error:", err);
      setFloors([]);
    }
  };

  const handleFloorChange = async (floorId) => {
    if (!floorId) {
      setRooms([]);
      setBeds([]);
      return;
    }

    try {
      const response = await api.get("/rooms", { params: { floorId } });
      setRooms(response.data);
    } catch (err) {
      console.error("Rooms error:", err);
      setRooms([]);
    }
  };

  const handleRoomChange = async (roomId) => {
    if (!roomId) {
      setBeds([]);
      return;
    }

    try {
      const response = await api.get("/beds", { params: { roomId } });
      setBeds(response.data);
    } catch (err) {
      console.error("Beds error:", err);
      setBeds([]);
    }
  };

  if (loading) return <PageContainer title="Booking"><p>Loading booking data...</p></PageContainer>;
  if (error) return <PageContainer title="Booking"><p style={{ color: "red" }}>{error}</p></PageContainer>;

  return (
    <PageContainer title="Booking">
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => onNavigate("dashboard")}
          style={{
            padding: "8px 16px",
            backgroundColor: "#f0f0f0",
            border: "1px solid #ddd",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            color: "#333"
          }}
        >
          ← Back to Dashboard
        </button>
      </div>
      <BookingForm
        onProceed={onProceed}
        buildings={buildings}
        floors={floors}
        rooms={rooms}
        beds={beds}
        onBuildingChange={handleBuildingChange}
        onFloorChange={handleFloorChange}
        onRoomChange={handleRoomChange}
      />
    </PageContainer>
  );
}

export default BookingPage;
