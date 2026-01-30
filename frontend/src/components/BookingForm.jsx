import { useState } from "react";
import FormRow from "./FormRow";
import "../styles/form.css";

function BookingForm({ onProceed, buildings, floors, rooms, beds, onBuildingChange, onFloorChange, onRoomChange }) {
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [room, setRoom] = useState("");
  const [selectedBed, setSelectedBed] = useState(null);

  const handleProceed = () => {
    if (!building || !floor || !room || !selectedBed) {
      alert("Please complete all booking fields");
      return;
    }

    onProceed({
      building,
      floor,
      room,
      bedId: selectedBed.id
    });
  };

  return (
    <>
      {/* BUILDING */}
      <FormRow label="Building" required>
        <select
          value={building}
          onChange={(e) => {
            setBuilding(e.target.value);
            setFloor("");
            setRoom("");
            setSelectedBed(null);
            onBuildingChange(e.target.value);
          }}
        >
          <option value="">-- Select --</option>
          {buildings.map(b => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </FormRow>

      {/* FLOOR */}
      <FormRow label="Floor" required>
        <select
          value={floor}
          disabled={!building}
          onChange={(e) => {
            setFloor(e.target.value);
            setRoom("");
            setSelectedBed(null);
            onFloorChange(e.target.value);
          }}
        >
          <option value="">-- Select --</option>
          {floors.map(f => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </FormRow>

      {/* ROOM */}
      <FormRow label="Room" required>
        <select
          value={room}
          disabled={!floor}
          onChange={(e) => {
            setRoom(e.target.value);
            setSelectedBed(null);
            onRoomChange(e.target.value);
          }}
        >
          <option value="">-- Select --</option>
          {rooms.map(r => (
            <option key={r.id} value={r.id}>
              {r.room_number}
            </option>
          ))}
        </select>
      </FormRow>

      {/* BED GRID */}
      <FormRow label="Bed" required>
        <div className="bed-grid">
          {beds.length === 0 && room ? (
            <p style={{color: '#666'}}>No beds available in this room</p>
          ) : beds.length === 0 ? (
            <p style={{color: '#666'}}>Please select a room first</p>
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
              >
                🛏 Bunk {bed.bunk_number} {bed.position === "L" ? "Lower" : "Upper"}
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
