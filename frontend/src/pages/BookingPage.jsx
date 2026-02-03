import { useState, useEffect } from "react";
import BookingForm from "../components/BookingForm";
import PageContainer from "../components/PageContainer";

function BookingPage({ onProceed, onNavigate }) {
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load buildings on mount
  useEffect(() => {
    fetch("http://localhost:5000/api/buildings")
      .then(res => res.json())
      .then(data => {
        setBuildings(data);
        setError(null);
        setLoading(false);
      })
      .catch(err => {
        console.error("Buildings error:", err);
        setError("Failed to load buildings");
        setLoading(false);
      });
  }, []);

  // Load floors when building changes
  const handleBuildingChange = (buildingId) => {
    console.log("🏢 Building changed to:", buildingId);
    
    if (!buildingId) {
      setFloors([]);
      setRooms([]);
      setBeds([]);
      return;
    }

    const url = `http://localhost:5000/api/floors?buildingId=${buildingId}`;
    console.log("📡 Fetching floors from:", url);

    fetch(url)
      .then(res => res.json())
      .then(data => {
        console.log("✅ Floors loaded:", data);
        console.log("📊 Number of floors:", data.length);
        
        setFloors(data);
      })
      .catch(err => console.error("❌ Floors error:", err));
  };

  // Load rooms when floor changes
  const handleFloorChange = (floorId) => {
    console.log("🏬 Floor changed to:", floorId);
    
    if (!floorId) {
      setRooms([]);
      setBeds([]);
      return;
    }

    const url = `http://localhost:5000/api/rooms?floorId=${floorId}`;
    console.log("📡 Fetching rooms from:", url);
    
    fetch(url)
      .then(res => {
        console.log("📥 Rooms API Response status:", res.status);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        console.log("✅ Rooms loaded:", data);
        console.log("📊 Number of rooms:", data.length);
        
        if (data.length === 0) {
          console.log("⚠️ No rooms found for floor ID:", floorId);
        }
        
        setRooms(data);
      })
      .catch(err => {
        console.error("❌ Rooms error:", err);
        setRooms([]);
      });
  };

  // Load beds when room changes
  const handleRoomChange = (roomId) => {
    console.log("🏠 Room changed to:", roomId);
    
    if (!roomId) {
      setBeds([]);
      return;
    }

    const url = `http://localhost:5000/api/beds?roomId=${roomId}`;
    console.log("📡 Fetching beds from:", url);

    fetch(url)
      .then(res => {
        console.log("📥 Beds API Response status:", res.status);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        console.log("✅ Beds loaded:", data);
        console.log("📊 Number of beds:", data.length);
        
        if (data.length === 0) {
          console.log("⚠️ No beds found for room ID:", roomId);
        }
        
        setBeds(data);
      })
      .catch(err => {
        console.error("❌ Beds error:", err);
        setBeds([]);
      });
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
