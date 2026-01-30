import { useState, useEffect } from "react";
import BookingForm from "../components/BookingForm";
import PageContainer from "../components/PageContainer";

function BookingPage({ onProceed }) {
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);

  // Load buildings on mount
  useEffect(() => {
    fetch("http://localhost:5000/api/buildings")
      .then(res => res.json())
      .then(data => setBuildings(data))
      .catch(err => console.error("Buildings error:", err));
  }, []);

  // Load floors when building changes
  const handleBuildingChange = (buildingId) => {
    if (!buildingId) {
      setFloors([]);
      setRooms([]);
      setBeds([]);
      return;
    }

    fetch(`http://localhost:5000/api/floors?buildingId=${buildingId}`)
      .then(res => res.json())
      .then(data => {
        console.log("Floors loaded:", data);
        setFloors(data);
      })
      .catch(err => console.error("Floors error:", err));
  };

  // Load rooms when floor changes
  const handleFloorChange = (floorId) => {
    console.log("🔍 handleFloorChange called with floorId:", floorId);
    
    if (!floorId) {
      setRooms([]);
      setBeds([]);
      return;
    }

    const url = `http://localhost:5000/api/rooms?floorId=${floorId}`;
    console.log("📡 Fetching rooms from:", url);
    
    fetch(url)
      .then(res => {
        console.log("📥 Response status:", res.status);
        return res.json();
      })
      .then(data => {
        console.log("✅ Rooms loaded:", data);
        console.log("📊 Number of rooms:", data.length);
        setRooms(data);
      })
      .catch(err => console.error("❌ Rooms error:", err));
  };

  // Load beds when room changes
  const handleRoomChange = (roomId) => {
    if (!roomId) {
      setBeds([]);
      return;
    }

    fetch(`http://localhost:5000/api/beds?roomId=${roomId}`)
      .then(res => res.json())
      .then(data => {
        console.log("Beds loaded:", data);
        setBeds(data);
      })
      .catch(err => console.error("Beds error:", err));
  };

  return (
    <PageContainer title="Booking">
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
