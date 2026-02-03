import { useState, useEffect } from "react";
import api from "../services/api";
import "../styles/block.css";

function BlockPage({ onNavigate }) {
  const [activeTab, setActiveTab] = useState("buildings"); // buildings, rooms, beds
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states for Building
  const [buildingForm, setBuildingForm] = useState({ buildingName: "", buildingCode: "" });

  // Form states for Room
  const [roomForm, setRoomForm] = useState({ roomNumber: "", building: "", floor: "", capacity: "" });

  // Form states for Bed
  const [bedForm, setBedForm] = useState({ bedNumber: "", room: "", building: "", floor: "" });

  // Fetch all data on load
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const buildingsRes = await api.get("/api/blocks/buildings");
      const roomsRes = await api.get("/api/blocks/rooms");
      const bedsRes = await api.get("/api/blocks/beds");
      
      setBuildings(buildingsRes.data);
      setRooms(roomsRes.data);
      setBeds(bedsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Error loading data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add Building
  const handleAddBuilding = async (e) => {
    e.preventDefault();
    if (!buildingForm.buildingName.trim()) {
      alert("Please enter building name");
      return;
    }
    try {
      await api.post("/api/blocks/buildings", buildingForm);
      alert("Building added successfully!");
      setBuildingForm({ buildingName: "", buildingCode: "" });
      fetchAllData();
    } catch (error) {
      alert("Error adding building: " + error.message);
    }
  };

  // Add Room
  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!roomForm.roomNumber || !roomForm.building || !roomForm.floor) {
      alert("Please fill all fields");
      return;
    }
    try {
      await api.post("/api/blocks/rooms", roomForm);
      alert("Room added successfully!");
      setRoomForm({ roomNumber: "", building: "", floor: "", capacity: "" });
      fetchAllData();
    } catch (error) {
      alert("Error adding room: " + error.message);
    }
  };

  // Add Bed
  const handleAddBed = async (e) => {
    e.preventDefault();
    if (!bedForm.bedNumber || !bedForm.room || !bedForm.building) {
      alert("Please fill all fields");
      return;
    }
    try {
      await api.post("/api/blocks/beds", bedForm);
      alert("Bed added successfully!");
      setBedForm({ bedNumber: "", room: "", building: "", floor: "" });
      fetchAllData();
    } catch (error) {
      alert("Error adding bed: " + error.message);
    }
  };

  // Delete Building
  const handleDeleteBuilding = async (id) => {
    if (window.confirm("Are you sure you want to delete this building?")) {
      try {
        await api.delete(`/api/blocks/buildings/${id}`);
        alert("Building deleted successfully!");
        fetchAllData();
      } catch (error) {
        alert("Error deleting building: " + error.message);
      }
    }
  };

  // Delete Room
  const handleDeleteRoom = async (id) => {
    if (window.confirm("Are you sure you want to delete this room?")) {
      try {
        await api.delete(`/api/blocks/rooms/${id}`);
        alert("Room deleted successfully!");
        fetchAllData();
      } catch (error) {
        alert("Error deleting room: " + error.message);
      }
    }
  };

  // Delete Bed
  const handleDeleteBed = async (id) => {
    if (window.confirm("Are you sure you want to delete this bed?")) {
      try {
        await api.delete(`/api/blocks/beds/${id}`);
        alert("Bed deleted successfully!");
        fetchAllData();
      } catch (error) {
        alert("Error deleting bed: " + error.message);
      }
    }
  };

  return (
    <div className="block-container">
      {/* Back Button */}
      <button 
        onClick={() => onNavigate("dashboard")}
        className="back-btn"
      >
        ← Back to Dashboard
      </button>

      <h1>Campus Block Management</h1>

      {/* Tab Navigation */}
      <div className="block-tabs">
        <button 
          className={`tab-btn ${activeTab === "buildings" ? "active" : ""}`}
          onClick={() => setActiveTab("buildings")}
        >
          🏢 Buildings
        </button>
        <button 
          className={`tab-btn ${activeTab === "rooms" ? "active" : ""}`}
          onClick={() => setActiveTab("rooms")}
        >
          🚪 Rooms
        </button>
        <button 
          className={`tab-btn ${activeTab === "beds" ? "active" : ""}`}
          onClick={() => setActiveTab("beds")}
        >
          🛏️ Beds
        </button>
      </div>

      {/* Buildings Tab */}
      {activeTab === "buildings" && (
        <div className="tab-content">
          <div className="form-section">
            <h2>Add New Building</h2>
            <form onSubmit={handleAddBuilding} className="block-form">
              <div className="form-group">
                <label>Building Name (e.g., Building-A, Building-B)</label>
                <input
                  type="text"
                  value={buildingForm.buildingName}
                  onChange={(e) => setBuildingForm({ ...buildingForm, buildingName: e.target.value })}
                  placeholder="Enter building name"
                />
              </div>
              <div className="form-group">
                <label>Building Code (Optional)</label>
                <input
                  type="text"
                  value={buildingForm.buildingCode}
                  onChange={(e) => setBuildingForm({ ...buildingForm, buildingCode: e.target.value })}
                  placeholder="e.g., BLD-001"
                />
              </div>
              <button type="submit" className="btn-submit">+ Add Building</button>
            </form>
          </div>

          <div className="list-section">
            <h2>Existing Buildings</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Building Name</th>
                  <th>Building Code</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {buildings.map((b) => (
                  <tr key={b.id}>
                    <td>{b.buildingName}</td>
                    <td>{b.buildingCode || "-"}</td>
                    <td><button className="btn-delete">Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rooms Tab */}
      {activeTab === "rooms" && (
        <div className="tab-content">
          <div className="form-section">
            <h2>Add New Room</h2>
            <form onSubmit={handleAddRoom} className="block-form">
              <div className="form-group">
                <label>Building</label>
                <select 
                  value={roomForm.building}
                  onChange={(e) => setRoomForm({ ...roomForm, building: e.target.value })}
                >
                  <option value="">Select Building</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.buildingName}>{b.buildingName}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Floor</label>
                <select 
                  value={roomForm.floor}
                  onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
                >
                  <option value="">Select Floor</option>
                  <option value="ground">Ground</option>
                  <option value="first">First</option>
                  <option value="second">Second</option>
                </select>
              </div>
              <div className="form-group">
                <label>Room Number</label>
                <input
                  type="number"
                  value={roomForm.roomNumber}
                  onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                  placeholder="e.g., 01, 02, 03"
                  min="1"
                  max="99"
                />
              </div>
              <div className="form-group">
                <label>Capacity (Optional)</label>
                <input
                  type="number"
                  value={roomForm.capacity}
                  onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                  placeholder="Number of beds"
                  min="1"
                />
              </div>
              <button type="submit" className="btn-submit">+ Add Room</button>
            </form>
          </div>

          <div className="list-section">
            <h2>Existing Rooms</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Building</th>
                  <th>Floor</th>
                  <th>Room Number</th>
                  <th>Capacity</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((r) => (
                  <tr key={r.id}>
                    <td>{r.buildingName}</td>
                    <td>{r.floorName}</td>
                    <td>{r.room_number}</td>
                    <td>{r.capacity || "-"}</td>
                    <td><button className="btn-delete">Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Beds Tab */}
      {activeTab === "beds" && (
        <div className="tab-content">
          <div className="form-section">
            <h2>Add New Bed</h2>
            <form onSubmit={handleAddBed} className="block-form">
              <div className="form-group">
                <label>Building</label>
                <select 
                  value={bedForm.building}
                  onChange={(e) => setRoomForm({ ...bedForm, building: e.target.value })}
                >
                  <option value="">Select Building</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.buildingName}>{b.buildingName}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Floor</label>
                <select 
                  value={bedForm.floor}
                  onChange={(e) => setBedForm({ ...bedForm, floor: e.target.value })}
                >
                  <option value="">Select Floor</option>
                  <option value="ground">Ground</option>
                  <option value="first">First</option>
                  <option value="second">Second</option>
                </select>
              </div>
              <div className="form-group">
                <label>Room Number</label>
                <input
                  type="number"
                  value={bedForm.room}
                  onChange={(e) => setBedForm({ ...bedForm, room: e.target.value })}
                  placeholder="e.g., 01, 02"
                  min="1"
                  max="99"
                />
              </div>
              <div className="form-group">
                <label>Bed Number</label>
                <input
                  type="number"
                  value={bedForm.bedNumber}
                  onChange={(e) => setBedForm({ ...bedForm, bedNumber: e.target.value })}
                  placeholder="e.g., 01, 02, 03..."
                  min="1"
                  max="99"
                />
              </div>
              <button type="submit" className="btn-submit">+ Add Bed</button>
            </form>
          </div>

          <div className="list-section">
            <h2>Existing Beds</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Building</th>
                  <th>Floor</th>
                  <th>Room</th>
                  <th>Bed Number</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {beds.map((b) => (
                  <tr key={b.id}>
                    <td>{b.buildingName}</td>
                    <td>{b.floorName}</td>
                    <td>{b.room_number}</td>
                    <td>{b.bunk_number}</td>
                    <td><button className="btn-delete">Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default BlockPage;