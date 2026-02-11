import { useState, useEffect } from "react";
import api from "../services/api";
import "../styles/camp.css";

function CampPage({ onNavigate }) {
  const [showManagement, setShowManagement] = useState(false); // Toggle between list and management
  const [activeTab, setActiveTab] = useState("buildings"); // buildings, floors, rooms, beds
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bedRooms, setBedRooms] = useState([]);
  const [filteredFloorRooms, setFilteredFloorRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [buildingFloors, setBuildingFloors] = useState({}); // Store actual floors per building
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("add"); // add, view, delete

  // Form states for Building
  const [buildingForm, setBuildingForm] = useState({ buildingName: "", buildingCode: "", floors: "" });

  // Form states for Floor
  const [floorForm, setFloorForm] = useState({ building: "", floorNumber: "" });

  // Form states for Room
  const [roomForm, setRoomForm] = useState({ roomNumber: "", building: "", floor: "", floorId: "", capacity: "" });

  // Form states for Bed
  const [bedForm, setBedForm] = useState({ bedNumber: "", room: "", building: "", floor: "" });
  const [bedCodeInput, setBedCodeInput] = useState(""); // For 6-digit code input
  const [parsedBedInfo, setParsedBedInfo] = useState(null); // Parsed code information

  // Search states for delete forms
  const [buildingSearch, setBuildingSearch] = useState("");
  const [floorSearch, setFloorSearch] = useState("");
  const [roomSearch, setRoomSearch] = useState("");
  const [bedSearch, setBedSearch] = useState("");
  const [bedCodeSearch, setBedCodeSearch] = useState(""); // For 6-digit code search
  const [deleteForm, setDeleteForm] = useState({ building: "", floor: "", room: "", bed: "" });
  const [buildingSequentialMap, setBuildingSequentialMap] = useState({}); // Map building name to sequential position

  // Create sequential building map when buildings change
  useEffect(() => {
    if (buildings.length > 0) {
      const map = {};
      // Sort buildings by their ID/creation order (same order as backend)
      const sortedBuildings = [...buildings].sort((a, b) => a.id - b.id);
      sortedBuildings.forEach((building, index) => {
        map[building.buildingName] = index + 1; // 1, 2, 3...
      });
      setBuildingSequentialMap(map);
    }
  }, [buildings]);

  // Filtered data based on search
  const filteredBuildings = buildings.filter(b => 
    b.buildingName.toLowerCase().includes(buildingSearch.toLowerCase()) ||
    (b.buildingCode && b.buildingCode.toLowerCase().includes(buildingSearch.toLowerCase()))
  );

  const filteredFloors = floors.filter(f => 
    (deleteForm.building === "" || f.building === deleteForm.building) &&
    (floorSearch === "" || f.floorNumber.toString().includes(floorSearch))
  );

  const filteredRooms = filteredFloorRooms.filter(
    (r) => String(r.roomNumber) === String(deleteForm.room)
  );

  const filteredBeds = beds.filter(b => 
    (deleteForm.building === "" || b.building === deleteForm.building) &&
    (deleteForm.floor === "" || String(b.floor) === String(deleteForm.floor)) &&
    (deleteForm.room === "" || String(b.room) === String(deleteForm.room)) &&
    (bedSearch === "" || 
      b.bedNumber.toString().includes(bedSearch) ||
      generateLocationCode(b.building, b.floor, b.room, b.bedNumber).includes(bedSearch))
  );

  // Helper function to generate 6-digit location code


  // Uses sequential building position (1st, 2nd, 3rd) not building name parsing
  const generateLocationCode = (building, floor, room, bed) => {
    // Get sequential building number from map
    const buildingNum = (buildingSequentialMap[building] || '1').toString().slice(-1);
    
    // Floor number
    const floorNum = String(floor).replace(/\D/g, '').slice(-1);
    
    // Room and bed numbers
    const roomNum = String(room).replace(/\D/g, '').padStart(2, '0').slice(-2) || '00';
    const bedNum = String(bed).replace(/\D/g, '').padStart(2, '0').slice(-2) || '00';
    
    // Combine: Building(1) + Floor(1) + Room(2) + Bed(2) = 6 digits
    return `${buildingNum}${floorNum}${roomNum}${bedNum}`;
  };

  // Parse 6-digit code into components
  const parseBedCode = (code) => {
    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      return null;
    }
    
    const buildingNum = parseInt(code[0]);
    const floorNum = code[1];
    const roomNum = code.substring(2, 4);
    const bedNum = code.substring(4, 6);
    
    // Find building name by sequential position
    const buildingName = Object.keys(buildingSequentialMap).find(
      name => buildingSequentialMap[name] === buildingNum
    );
    
    return {
      building: buildingName || `Building #${buildingNum}`,
      floor: parseInt(floorNum),
      room: parseInt(roomNum),
      bed: parseInt(bedNum),
      code: code
    };
  };

  // Handle bed code input change
  const handleBedCodeChange = (code) => {
    setBedCodeInput(code);
    const parsed = parseBedCode(code);
    setParsedBedInfo(parsed);
    
    if (parsed) {
      setBedForm({
        building: parsed.building,
        floor: String(parsed.floor),
        room: String(parsed.room),
        bedNumber: String(parsed.bed)
      });
    }
  };

  const filteredBedsByCode = bedCodeSearch 
    ? beds.filter(b => generateLocationCode(b.building, b.floor, b.room, b.bedNumber).includes(bedCodeSearch))
    : beds;

  const roomFloorsForSelectedBuilding = floors
    .filter((f) => f.building === roomForm.building)
    .sort((a, b) => Number(a.floorNumber) - Number(b.floorNumber));

  // Fetch all data on load
  useEffect(() => {
    fetchAllData();
  }, []);

  // Fetch room options from room table for Add Bed form
  useEffect(() => {
    const loadBedRooms = async () => {
      if (!bedForm.building || !bedForm.floor) {
        setBedRooms([]);
        return;
      }

      try {
        const response = await api.get("/camps/rooms", {
          params: {
            building: bedForm.building,
            floor: bedForm.floor
          }
        });
        setBedRooms(response.data || []);
      } catch (error) {
        console.error("Error fetching rooms for bed form:", error);
        setBedRooms([]);
      }
    };

    loadBedRooms();
  }, [bedForm.building, bedForm.floor]);

  // Fetch room options floor-wise for delete flows
  useEffect(() => {
    const loadFloorRooms = async () => {
      if (!deleteForm.building || !deleteForm.floor) {
        setFilteredFloorRooms([]);
        return;
      }

      try {
        const response = await api.get("/camps/rooms", {
          params: {
            building: deleteForm.building,
            floor: deleteForm.floor
          }
        });
        setFilteredFloorRooms(response.data || []);
      } catch (error) {
        console.error("Error fetching floor-wise rooms:", error);
        setFilteredFloorRooms([]);
      }
    };

    loadFloorRooms();
  }, [deleteForm.building, deleteForm.floor]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const buildingsRes = await api.get("/camps/buildings");
      const floorsRes = await api.get("/camps/floors");
      const roomsRes = await api.get("/camps/rooms");
      const bedsRes = await api.get("/camps/beds");
      
      console.log("Fetched rooms data:", roomsRes.data);
      
      setBuildings(buildingsRes.data);
      setFloors(floorsRes.data);
      setRooms(roomsRes.data);
      setBeds(bedsRes.data);
      
      // Fetch actual floors for each building
      const floorsData = {};
      for (const building of buildingsRes.data) {
        try {
          const floorsRes = await api.get(`/camps/floors/${building.buildingName}`);
          floorsData[building.buildingName] = floorsRes.data;
        } catch (err) {
          console.error(`Error fetching floors for ${building.buildingName}:`, err);
          floorsData[building.buildingName] = [];
        }
      }
      setBuildingFloors(floorsData);
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
    if (!buildingForm.buildingName || buildingForm.buildingName.trim() === "") {
      alert("Please enter building name");
      return;
    }
    const numFloors = parseInt(buildingForm.floors);
    if (isNaN(numFloors) || numFloors < 1) {
      alert("Number of floors must be a positive number.");
      return;
    }

    try {
      await api.post("/camps/buildings", buildingForm);
      alert("Building added successfully!");
      
      fetchAllData();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      alert("Error adding building: " + errorMessage);
    }
  };

  // Add Room
  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!roomForm.roomNumber || !roomForm.building || !roomForm.floor || !roomForm.floorId) {
      alert("Please fill all fields");
      return;
    }
    try {
      await api.post("/camps/rooms", roomForm);
      alert("Room added successfully!");
      setRoomForm({ roomNumber: "", building: "", floor: "", floorId: "", capacity: "" });
      fetchAllData();
    } catch (error) {
      alert("Error adding room: " + error.message);
    }
  };

  // Add Bed
  const handleAddBed = async (e) => {
    e.preventDefault();
    if (!bedForm.bedNumber || !bedForm.room || !bedForm.building || !bedForm.floor) {
      alert("Please fill all required fields");
      return;
    }
    const numBeds = parseInt(bedForm.bedNumber);
    if (numBeds < 1) {
      alert("Number of beds must be at least 1");
      return;
    }
    try {
      console.log("Sending bed data:", bedForm);
      const response = await api.post("/camps/beds", bedForm);
      alert(response.data.message || "Beds added successfully!");
      setBedForm({ bedNumber: "", room: "", building: "", floor: "" });
      setBedCodeInput("");
      setParsedBedInfo(null);
      fetchAllData();
    } catch (error) {
      console.error("Bed addition error:", error.response?.data || error);
      alert("Error adding beds: " + (error.response?.data?.error || error.message));
    }
  };

  // Delete Building
  const handleDeleteBuilding = async (id) => {
    if (window.confirm("Are you sure you want to delete this building?")) {
      try {
        await api.delete(`/camps/buildings/${id}`);
        alert("Building deleted successfully!");
        setViewMode("add");
        setBuildingSearch("");
        fetchAllData();
      } catch (error) {
        alert("Error deleting building: " + (error.response?.data?.error || error.message));
      }
    }
  };

  // Add Floor
  const handleAddFloor = async (e) => {
    e.preventDefault();
    if (!floorForm.building || !floorForm.floorNumber) {
      alert("Please fill all fields");
      return;
    }
    try {
      await api.post("/camps/floors", floorForm);
      alert("Floor added successfully!");
      setFloorForm({ building: "", floorNumber: "" });
      fetchAllData();
    } catch (error) {
      alert("Error adding floor: " + error.message);
    }
  };

  // Delete Floor
  const handleDeleteFloor = async (id) => {
    if (window.confirm("Are you sure you want to delete this floor?")) {
      try {
        await api.delete(`/camps/floors/${id}`);
        alert("Floor deleted successfully!");
        setViewMode("add");
        setFloorSearch("");
        setDeleteForm({ building: "", floor: "", room: "", bed: "" });
        fetchAllData();
      } catch (error) {
        alert("Error deleting floor: " + (error.response?.data?.error || error.message));
      }
    }
  };

  // Delete Room
  const handleDeleteRoom = async (id) => {
    if (window.confirm("Are you sure you want to delete this room?")) {
      try {
        await api.delete(`/camps/rooms/${id}`);
        alert("Room deleted successfully!");
        setViewMode("add");
        setRoomSearch("");
        setDeleteForm({ building: "", floor: "", room: "", bed: "" });
        fetchAllData();
      } catch (error) {
        alert("Error deleting room: " + (error.response?.data?.error || error.message));
      }
    }
  };

  // Delete Bed
  const handleDeleteBed = async (id) => {
    if (window.confirm("Are you sure you want to delete this bed?")) {
      try {
        await api.delete(`/camps/beds/${id}`);
        alert("Bed deleted successfully!");
        setViewMode("add");
        setBedSearch("");
        setDeleteForm({ building: "", floor: "", room: "", bed: "" });
        fetchAllData();
      } catch (error) {
        alert("Error deleting bed: " + (error.response?.data?.error || error.message));
      }
    }
  };

  return (
    <div className="camp-container">
      {/* Header Section */}
      <div className="page-header-full">
        <div className="title-row">
          <button 
            onClick={() => onNavigate("dashboard")}
            className="back-btn"
          >
            ← Back to Dashboard
          </button>
          <h1>Campus Management</h1>
        </div>

        {/* Camp Details Table */}
        {!showManagement && (
          <div className="camp-details-section">
            <div className="camp-header">
              <h2>Camp Details:</h2>
              <button 
                className="btn-add-camp"
                onClick={() => setShowManagement(true)}
              >
                + Add Camp
              </button>
            </div>
            <div className="camp-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sl.No</th>
                    <th>Camp Name (Alias Name)</th>
                    <th>No. of Floors</th>
                    <th>No. of Rooms</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {buildings.length > 0 ? (
                    buildings.map((b, index) => {
                      const buildingFloorsList = floors.filter(f => f.building === b.buildingName);
                      const buildingRoomsList = rooms.filter(r => r.building === b.buildingName);
                      return (
                        <tr key={b.id}>
                          <td>{index + 1}</td>
                          <td>{b.buildingName} {b.buildingCode ? `(${b.buildingCode})` : ''}</td>
                          <td>{buildingFloorsList.length}</td>
                          <td>{buildingRoomsList.length}</td>
                          <td>
                            <button 
                              className="btn-action"
                              onClick={() => setShowManagement(true)}
                              title="View Details"
                              style={{ marginRight: '8px' }}
                            >
                              👁️
                            </button>
                            <button 
                              className="btn-action btn-delete"
                              onClick={() => {
                                setShowManagement(true);
                                setViewMode("delete");
                                setTimeout(() => {
                                  document.getElementById('delete-buildings-section')?.scrollIntoView({ behavior: 'smooth' });
                                }, 200);
                              }}
                              title="Delete Building"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" style={{textAlign: 'center'}}>No camps found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Block Management Interface */}
        {showManagement && (
          <>
            <div className="management-header">
              <button 
                onClick={() => setShowManagement(false)}
                className="back-btn"
              >
                ← Back to Camp List
              </button>
            </div>
        
        <div className="controls-row">
          {/* Mode Toggle */}
          <div className="mode-toggle">
            <button 
              className={`mode-btn ${viewMode === "add" ? "active" : ""}`}
              onClick={() => setViewMode("add")}
            >
              Add New
            </button>
            <button 
              className={`mode-btn ${viewMode === "delete" ? "active" : ""}`}
              onClick={() => setViewMode("delete")}
            >
              Delete
            </button>
          </div>
          
          {/* Tab Navigation */}
          <div className="block-tabs">
            <button 
              className={`tab-btn ${activeTab === "buildings" ? "active" : ""}`}
              onClick={() => setActiveTab("buildings")}
            >
              🏢 Buildings
            </button>
            <button 
              className={`tab-btn ${activeTab === "floors" ? "active" : ""}`}
              onClick={() => setActiveTab("floors")}
            >
              📊 Floors
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
        </div>

        {/* Buildings Tab */}
        {activeTab === "buildings" && (
        <div className="tab-content-single">
          <div className="form-section-full">
            {viewMode === "add" ? (
              <div className="two-column-layout">
                <div className="form-column">
                  <div className="section-header">
                    <h2>Add New Building</h2>
                  </div>
                  <form onSubmit={handleAddBuilding} className="block-form">
                    <div className="form-group">
                      <label>Building Name</label>
                      <input
                        type="text"
                        value={buildingForm.buildingName}
                        onChange={(e) => setBuildingForm({ ...buildingForm, buildingName: e.target.value })}
                        placeholder="Enter building name (e.g., Main Building, Block A)"
                      />
                      <small style={{ color: '#666', fontSize: '12px' }}>Location codes will use building ID (1, 2, 3, etc.)</small>
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
                    <div className="form-group">
                      <label>Number of Floors</label>
                      <input
                        type="number"
                        value={buildingForm.floors}
                        onChange={(e) => setBuildingForm({ ...buildingForm, floors: e.target.value })}
                        placeholder="e.g., 3"
                        min="1"
                        max="10"
                      />
                    </div>
                    <button type="submit" className="btn-submit">+ Add Building</button>
                  </form>
                </div>
                <div className="view-column">
                  <div className="section-header">
                    <h2>Existing Buildings</h2>
                  </div>
                  <div className="existing-list">
                    {buildings.length > 0 ? (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Building Name</th>
                            <th>Building Code</th>
                            <th>Number of Floors</th>
                            <th>Floors</th>
                          </tr>
                        </thead>
                        <tbody>
                          {buildings.map((b) => {
                            const buildingFloorsList = floors.filter(f => f.building === b.buildingName);
                            return (
                              <tr key={b.id}>
                                <td><strong>{b.buildingName}</strong></td>
                                <td>{b.buildingCode || "N/A"}</td>
                                <td>{buildingFloorsList.length}</td>
                                <td>
                                  {buildingFloorsList.length > 0 ? (
                                    buildingFloorsList
                                      .map((f) => f.floorName || `Floor ${f.floorNumber}`)
                                      .join(", ")
                                  ) : (
                                    "No floors"
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <p className="no-data">No buildings found.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="section-header" id="delete-buildings-section">
                  <h2>Delete Building</h2>
                </div>
                <div className="block-form">
                  <div className="form-group">
                    <label>Search Building</label>
                    <input
                      type="text"
                      value={buildingSearch}
                      onChange={(e) => setBuildingSearch(e.target.value)}
                      placeholder="Search by building name or code..."
                      className="search-input"
                    />
                  </div>
                  {buildingSearch && (
                    <div className="search-results">
                      <p className="results-count">
                        {filteredBuildings.length} building(s) found
                      </p>
                      {filteredBuildings.length > 0 ? (
                        <div className="results-list">
                          {filteredBuildings.map((b) => (
                            <div key={b.id} className="result-item">
                              <div className="result-info">
                                <strong>{b.buildingName}</strong>
                                {b.buildingCode && <span className="code">({b.buildingCode})</span>}
                              </div>
                              <button
                                onClick={() => handleDeleteBuilding(b.id)}
                                className="btn-delete-confirm"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-results">No buildings found matching your search.</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floors Tab */}
      {activeTab === "floors" && (
        <div className="tab-content-single">
          <div className="form-section-full">
            {viewMode === "add" ? (
              <div className="two-column-layout">
                <div className="form-column">
                  <div className="section-header">
                    <h2>Add New Floor</h2>
                  </div>
                  <form onSubmit={handleAddFloor} className="block-form">
                    <div className="form-group">
                      <label>Building</label>
                      <select 
                        value={floorForm.building}
                        onChange={(e) => setFloorForm({ ...floorForm, building: e.target.value })}
                      >
                        <option value="">Select Building</option>
                        {buildings.map((b) => (
                          <option key={b.id} value={b.buildingName}>{b.buildingName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Number of Floors to Add</label>
                      <input
                        type="number"
                        value={floorForm.floorNumber}
                        onChange={(e) => setFloorForm({ ...floorForm, floorNumber: e.target.value })}
                        placeholder="e.g., 2 (adds 2 floors)"
                        min="1"
                        max="10"
                      />
                      <small style={{color: '#666', fontSize: '0.85em'}}>Floor numbers will be assigned automatically</small>
                    </div>
                    <button type="submit" className="btn-submit">+ Add Floor</button>
                  </form>
                </div>
                <div className="view-column">
                  <div className="section-header">
                    <h2>Existing Floors</h2>
                  </div>
                  <div className="existing-list">
                    {buildings.length > 0 ? (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Building Name</th>
                            <th>Building Code</th>
                            <th>Number of Floors</th>
                            <th>Floors</th>
                          </tr>
                        </thead>
                        <tbody>
                          {buildings.map((b) => {
                            const buildingFloorsList = floors.filter(f => f.building === b.buildingName);
                            return (
                              <tr key={b.id}>
                                <td><strong>{b.buildingName}</strong></td>
                                <td>{b.buildingCode || "N/A"}</td>
                                <td>{buildingFloorsList.length}</td>
                                <td>
                                  {buildingFloorsList.length > 0 ? (
                                    buildingFloorsList
                                      .map((f) => f.floorName || `Floor ${f.floorNumber}`)
                                      .join(", ")
                                  ) : (
                                    "No floors"
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <p className="no-data">No floors found.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="section-header">
                  <h2>Delete Floor</h2>
                </div>
                <div className="block-form">
                  <div className="form-group">
                    <label>Building</label>
                    <select 
                      value={deleteForm.building}
                      onChange={(e) => setDeleteForm({ ...deleteForm, building: e.target.value, floor: "" })}
                    >
                      <option value="">Select Building</option>
                      {buildings.map((b) => (
                        <option key={b.id} value={b.buildingName}>{b.buildingName}</option>
                      ))}
                    </select>
                  </div>
                  {deleteForm.building && (
                    <div className="form-group">
                      <label>Search Floor Number</label>
                      <input
                        type="text"
                        value={floorSearch}
                        onChange={(e) => setFloorSearch(e.target.value)}
                        placeholder="Search floor number..."
                        className="search-input"
                      />
                    </div>
                  )}
                  {deleteForm.building && floorSearch && (
                    <div className="search-results">
                      <p className="results-count">
                        {filteredFloors.length} floor(s) found
                      </p>
                      {filteredFloors.length > 0 ? (
                        <div className="results-list">
                          {filteredFloors.map((f) => (
                            <div key={f.id} className="result-item">
                              <div className="result-info">
                                <strong>Floor {f.floorNumber}</strong>
                                <span className="detail">{f.building}</span>
                              </div>
                              <button
                                onClick={() => handleDeleteFloor(f.id)}
                                className="btn-delete-confirm"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-results">No floors found matching your search.</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Rooms Tab */}
      {activeTab === "rooms" && (
        <div className="tab-content-single">
          <div className="form-section-full">
            {viewMode === "add" ? (
              <div className="two-column-layout">
                <div className="form-column">
                  <div className="section-header">
                    <h2>Add New Room</h2>
                  </div>
                  <form onSubmit={handleAddRoom} className="block-form">
                    <div className="form-group">
                      <label>Building</label>
                      <select 
                        value={roomForm.building}
                        onChange={(e) => setRoomForm({ ...roomForm, building: e.target.value, floor: "", floorId: "" })}
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
                        value={roomForm.floorId}
                        onChange={(e) => {
                          const selectedFloor = roomFloorsForSelectedBuilding.find(
                            (f) => String(f.id) === e.target.value
                          );
                          setRoomForm({
                            ...roomForm,
                            floorId: e.target.value,
                            floor: selectedFloor ? String(selectedFloor.floorNumber) : ""
                          });
                        }}
                        disabled={!roomForm.building}
                      >
                        <option value="">Select Floor</option>
                        {roomFloorsForSelectedBuilding.map((floorObj) => (
                          <option key={floorObj.id} value={floorObj.id}>
                            {Number(floorObj.floorNumber) === 1
                              ? `Ground Floor (1)`
                              : `Floor ${floorObj.floorNumber}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Number of Rooms to Add</label>
                      <input
                        type="number"
                        value={roomForm.roomNumber}
                        onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                        placeholder="e.g., 5 (adds 5 rooms)"
                        min="1"
                        max="50"
                      />
                      <small style={{color: '#666', fontSize: '0.85em'}}>Room numbers will be assigned automatically (01, 02, 03...)</small>
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
                <div className="view-column">
                  <div className="section-header">
                    <h2>Existing Rooms</h2>
                  </div>
                  <div className="existing-list">
                    {buildings.length > 0 ? (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Building</th>
                            <th>Floor</th>
                            <th>No. of Rooms</th>
                          </tr>
                        </thead>
                        <tbody>
                          {buildings.map((b) => {
                            const buildingFloorsList = floors.filter(f => f.building === b.buildingName);
                            return buildingFloorsList.map((floor, floorIndex) => {
                              const roomsInFloor = rooms.filter(r => 
                                r.building === b.buildingName && r.floor === floor.floorNumber
                              );
                              return (
                                <tr key={`${b.id}-${floor.id}`}>
                                  {floorIndex === 0 && (
                                    <td rowSpan={buildingFloorsList.length}>
                                      <strong>{b.buildingName}</strong>
                                    </td>
                                  )}
                                  <td>{floor.floorName || `Floor ${floor.floorNumber}`}</td>
                                  <td>{roomsInFloor.length}</td>
                                </tr>
                              );
                            });
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <p className="no-data">No rooms found.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="section-header">
                  <h2>Delete Room</h2>
                </div>
                <div className="block-form">
                  <div className="form-group">
                    <label>Building</label>
                    <select 
                      value={deleteForm.building}
                      onChange={(e) => setDeleteForm({ ...deleteForm, building: e.target.value, floor: "", room: "" })}
                    >
                      <option value="">Select Building</option>
                      {buildings.map((b) => (
                        <option key={b.id} value={b.buildingName}>{b.buildingName}</option>
                      ))}
                    </select>
                  </div>
                  {deleteForm.building && (
                    <div className="form-group">
                      <label>Floor</label>
                      <select 
                        value={deleteForm.floor}
                        onChange={(e) => setDeleteForm({ ...deleteForm, floor: e.target.value, room: "" })}
                      >
                        <option value="">Select Floor</option>
                        {buildingFloors[deleteForm.building]?.map(floorNum => (
                          <option key={floorNum} value={floorNum}>
                            {floorNum === 1 ? 'Ground Floor (1)' : `Floor ${floorNum}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {deleteForm.floor && (
                    <div className="form-group">
                      <label>Room Number</label>
                      <select
                        value={deleteForm.room}
                        onChange={(e) => setDeleteForm({ ...deleteForm, room: e.target.value })}
                      >
                        <option value="">Select Room</option>
                        {filteredFloorRooms
                          .slice()
                          .sort((a, b) => parseInt(a.roomNumber) - parseInt(b.roomNumber))
                          .map((r, index) => (
                            <option key={r.id} value={r.roomNumber}>
                              Room {index + 1} {r.capacity ? `(Capacity: ${r.capacity})` : ""}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                  {deleteForm.room && (
                    <div className="search-results">
                      <p className="results-count">
                        Room selected for deletion
                      </p>
                      {filteredRooms.length > 0 ? (
                        <div className="results-list">
                          {filteredRooms.map((r) => (
                            <div key={r.id} className="result-item">
                              <div className="result-info">
                                <strong>Room {parseInt(r.roomNumber)}</strong>
                                <span className="detail">Floor {r.floor}, {r.building}</span>
                                {r.capacity && <span className="detail">Capacity: {r.capacity}</span>}
                              </div>
                              <button
                                onClick={() => handleDeleteRoom(r.id)}
                                className="btn-delete-confirm"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-results">Room not found.</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Beds Tab */}
      {activeTab === "beds" && (
        <div className="tab-content-single">
          <div className="form-section-full">
            {viewMode === "add" ? (
              <div className="two-column-layout">
                <div className="form-column">
                  <div className="section-header">
                    <h2>Add New Bed</h2>
                    <p className="section-subtitle">Use 6-digit code or manual entry</p>
                  </div>
                  <form onSubmit={handleAddBed} className="block-form">
                    {/* Code-Based Entry */}
                    <div className="form-group code-input-group">
                      <label>
                        <strong>Option 1: Enter 6-Digit Location Code</strong>
                        <span className="label-help">Format: BuildingFloorRoomBed (e.g., 110102)</span>
                      </label>
                      <input
                        type="text"
                        value={bedCodeInput}
                        onChange={(e) => handleBedCodeChange(e.target.value)}
                        placeholder="e.g., 110102"
                        maxLength="6"
                        className="code-input"
                      />
                      {parsedBedInfo && (
                        <div className="code-preview">
                          ✓ Parsed: {parsedBedInfo.building}, Floor {parsedBedInfo.floor}, Room {parsedBedInfo.room}, Bed {parsedBedInfo.bed}
                        </div>
                      )}
                      {bedCodeInput && !parsedBedInfo && bedCodeInput.length === 6 && (
                        <div className="code-error">
                          ✗ Invalid code format
                        </div>
                      )}
                    </div>

                    <div className="divider">
                      <span>OR</span>
                    </div>

                    {/* Manual Entry */}
                    <div className="manual-entry-section">
                      <label className="section-label"><strong>Option 2: Manual Entry</strong></label>
                      
                      <div className="form-group">
                        <label>Building</label>
                        <select 
                          value={bedForm.building}
                          onChange={(e) => setBedForm({ ...bedForm, building: e.target.value, floor: "", room: "" })}
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
                          onChange={(e) => setBedForm({ ...bedForm, floor: e.target.value, room: "" })}
                          disabled={!bedForm.building}
                        >
                          <option value="">Select Floor</option>
                          {bedForm.building && buildingFloors[bedForm.building]?.map(floorNum => (
                            <option key={floorNum} value={floorNum}>
                              {floorNum === 1 ? 'Ground Floor (1)' : `Floor ${floorNum}`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Room Number</label>
                        <select
                          value={bedForm.room}
                          onChange={(e) => setBedForm({ ...bedForm, room: e.target.value })}
                          disabled={!bedForm.floor}
                        >
                          <option value="">Select Room</option>
                          {bedRooms
                          .sort((a, b) => parseInt(a.roomNumber) - parseInt(b.roomNumber))
                          .map((r, index) => (
                            <option key={r.id} value={r.roomNumber}>
                              Room {index + 1}
                            </option>
                          ))
                          }
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Number of Beds to Add</label>
                        <input
                          type="number"
                          value={bedForm.bedNumber}
                          onChange={(e) => setBedForm({ ...bedForm, bedNumber: e.target.value })}
                          placeholder="e.g., 30 (adds 30 beds)"
                          min="1"
                        />
                        <small style={{color: '#666', fontSize: '0.85em'}}>Bed numbers will be assigned automatically (1, 2, 3...)</small>
                      </div>
                    </div>
                    
                    <button type="submit" className="btn-submit">+ Add Bed</button>
                  </form>
                </div>
                <div className="view-column">
                  <div className="section-header">
                    <h2>Existing Beds</h2>
                    <div className="search-box">
                      <input
                        type="text"
                        value={bedCodeSearch}
                        onChange={(e) => setBedCodeSearch(e.target.value)}
                        placeholder="Search by code or bed number..."
                        className="search-input-inline"
                      />
                    </div>
                  </div>
                  <div className="existing-list">
                    {filteredBedsByCode.length > 0 ? (
                      <table className="data-table compact">
                        <thead>
                          <tr>
                            <th>Code</th>
                            <th>Building</th>
                            <th>Floor</th>
                            <th>Room</th>
                            <th>Bed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBedsByCode.map((b) => (
                            <tr key={b.id}>
                              <td><code>{generateLocationCode(b.building, b.floor, b.room, b.bedNumber)}</code></td>
                              <td>{b.building}</td>
                              <td>{b.floor}</td>
                              <td>{b.room}</td>
                              <td>{b.bedNumber}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="no-data">No beds found.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="section-header">
                  <h2>Delete Bed</h2>
                  <p className="section-subtitle">Search by code or use filters</p>
                </div>
                <div className="block-form">
                  {/* Code-based search */}
                  <div className="form-group">
                    <label><strong>Search by Location Code</strong></label>
                    <input
                      type="text"
                      value={bedCodeSearch}
                      onChange={(e) => setBedCodeSearch(e.target.value)}
                      placeholder="Enter 6-digit code (e.g., 110102)"
                      maxLength="6"
                      className="code-input"
                    />
                  </div>

                  <div className="divider">
                    <span>OR</span>
                  </div>

                  {/* Filter-based search */}
                  <div className="form-group">
                    <label>Building</label>
                    <select 
                      value={deleteForm.building}
                      onChange={(e) => setDeleteForm({ ...deleteForm, building: e.target.value, floor: "", room: "", bed: "" })}
                    >
                      <option value="">Select Building</option>
                      {buildings.map((b) => (
                        <option key={b.id} value={b.buildingName}>{b.buildingName}</option>
                      ))}
                    </select>
                  </div>
                  {deleteForm.building && (
                    <div className="form-group">
                      <label>Floor</label>
                      <select 
                        value={deleteForm.floor}
                        onChange={(e) => setDeleteForm({ ...deleteForm, floor: e.target.value, room: "", bed: "" })}
                      >
                        <option value="">Select Floor</option>
                        {buildingFloors[deleteForm.building]?.map(floorNum => (
                          <option key={floorNum} value={floorNum}>
                            {floorNum === 1 ? 'Ground Floor (1)' : `Floor ${floorNum}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {deleteForm.floor && (
                    <div className="form-group">
                      <label>Room</label>
                      <select 
                        value={deleteForm.room}
                        onChange={(e) => setDeleteForm({ ...deleteForm, room: e.target.value, bed: "" })}
                      >
                        <option value="">Select Room</option>
                        {filteredFloorRooms
                          .slice()
                          .sort((a, b) => parseInt(a.roomNumber) - parseInt(b.roomNumber))
                          .map((r, index) => (
                            <option key={r.id} value={r.roomNumber}>
                              Room {index + 1}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                  {(bedCodeSearch || (deleteForm.building && deleteForm.floor && deleteForm.room)) && (
                    <div className="search-results">
                      <p className="results-count">
                        {bedCodeSearch 
                          ? `${filteredBedsByCode.length} bed(s) found for code "${bedCodeSearch}"`
                          : `${filteredBeds.length} bed(s) found`
                        }
                      </p>
                      {(bedCodeSearch ? filteredBedsByCode : filteredBeds).length > 0 ? (
                        <div className="results-list">
                          {(bedCodeSearch ? filteredBedsByCode : filteredBeds).map((b) => (
                            <div key={b.id} className="result-item">
                              <div className="result-info">
                                <strong><code>{generateLocationCode(b.building, b.floor, b.room, b.bedNumber)}</code></strong>
                                <span className="detail">{b.building}, Floor {b.floor}, Room {b.room}, Bed {b.bedNumber}</span>
                              </div>
                              <button
                                onClick={() => handleDeleteBed(b.id)}
                                className="btn-delete-confirm"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-results">No beds found matching your search.</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      </>
        )}
      </div>
    </div>
  );
}

export default CampPage;
