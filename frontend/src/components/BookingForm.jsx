import { useState } from "react";
import FormRow from "./FormRow";
import "../styles/form.css";

function BookingForm({ 
  onProceed, 
  buildings = [], 
  floors = [], 
  rooms = [], 
  beds = [], 
  onBuildingChange, 
  onFloorChange, 
  onRoomChange 
}) {
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [room, setRoom] = useState("");
  const [selectedBed, setSelectedBed] = useState(null);

  const handleProceed = () => {
    if (!building || !floor || !room || !selectedBed) {
      alert("Please complete all booking fields");
      return;
    }

    // Get building and floor names for display
    const buildingName = buildings.find(b => b.id == building)?.name || building;
    const floorName = floors.find(f => f.id == floor)?.name || floor;
    const roomNumber = rooms.find(r => r.id == room)?.room_number || room;

    onProceed({
      building: buildingName,
      buildingId: building,
      floor: floorName, 
      floorId: floor,
      room: roomNumber,
      roomId: room,
      bedId: selectedBed.id,
      bedNumber: selectedBed.bed_number,
      fullLocation: `${buildingName} - ${floorName} - Room ${roomNumber} - Bed ${selectedBed.bed_number}`
    });
  };

  return (
    <>
      {/* BUILDING GRID */}
      <FormRow label="Building" required>
        <div className="selection-grid">
          {buildings.length === 0 ? (
            <p style={{color: '#666', textAlign: 'center', padding: '20px'}}>No buildings available</p>
          ) : (
            buildings.map(b => (
              <button
                key={b.id}
                type="button"
                className={`selection-card ${building === b.id ? "card-selected" : ""}`}
                onClick={() => {
                  setBuilding(b.id);
                  setFloor("");
                  setRoom("");
                  setSelectedBed(null);
                  onBuildingChange(b.id);
                }}
              >
                {b.name}
              </button>
            ))
          )}
        </div>
      </FormRow>

      {/* FLOOR GRID */}
      <FormRow label="Floor" required>
        <div className="selection-grid">
          {!building ? (
            <p style={{color: '#999', textAlign: 'center', padding: '20px', fontStyle: 'italic'}}>Select a building first</p>
          ) : floors.length === 0 ? (
            <p style={{color: '#666', textAlign: 'center', padding: '20px'}}>No floors available</p>
          ) : (
            floors.map(f => (
              <button
                key={f.id}
                type="button"
                className={`selection-card ${floor === f.id ? "card-selected" : ""}`}
                onClick={() => {
                  setFloor(f.id);
                  setRoom("");
                  setSelectedBed(null);
                  onFloorChange(f.id);
                }}
              >
                {f.name}
              </button>
            ))
          )}
        </div>
      </FormRow>

      {/* ROOM GRID */}
      <FormRow label="Room" required>
        <div className="selection-grid">
          {!floor ? (
            <p style={{color: '#999', textAlign: 'center', padding: '20px', fontStyle: 'italic'}}>Select a floor first</p>
          ) : rooms.length === 0 ? (
            <p style={{color: '#666', textAlign: 'center', padding: '20px'}}>No rooms available</p>
          ) : (
            rooms.map(r => (
              <button
                key={r.id}
                type="button"
                className={`selection-card ${room === r.id ? "card-selected" : ""}`}
                onClick={() => {
                  setRoom(r.id);
                  setSelectedBed(null);
                  onRoomChange(r.id);
                }}
              >
                Room {r.room_number}
              </button>
            ))
          )}
        </div>
      </FormRow>

      {/* BED GRID */}
      <FormRow label="Bed" required>
        <div className="bed-grid">
          {beds.length === 0 && room ? (
            <p style={{color: '#666', textAlign: 'center', padding: '20px'}}>No beds available in this room</p>
          ) : beds.length === 0 ? (
            <p style={{color: '#999', textAlign: 'center', padding: '20px', fontStyle: 'italic'}}>Please select a room first</p>
          ) : (
            beds.map((bed) => (
              <button
                key={bed.id}
                type="button"
                className={`bed-btn 
                  ${bed.status !== 'AVAILABLE' ? "bed-disabled" : ""} 
                  ${selectedBed?.id === bed.id ? "bed-selected" : ""}
                `}
                disabled={bed.status !== 'AVAILABLE'}
                onClick={() => setSelectedBed(bed)}
                title={`Bed ${bed.bed_number} - ${bed.status}`}
              >
                Bed {bed.bed_number}
                {bed.status === 'BOOKED' && <span className="status-badge">Booked</span>}
              </button>
            ))
          )}
        </div>
      </FormRow>

      <div className="button-group">
        <button className="btn-submit" onClick={handleProceed}>
          Proceed
        </button>
      </div>
    </>
  );
}

export default BookingForm;
