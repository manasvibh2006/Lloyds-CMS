import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import "../styles/report.css";
import * as XLSX from "xlsx";
import html2pdf from "html2pdf.js";
import logo from "../assets/lloyds-logo.jpg";

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

function ReportPage({ onNavigate }) {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupedData, setGroupedData] = useState({});
  const reportRef = useRef();

  // Filter states
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [selectedUser, setSelectedUser] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    fetchAllocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAllocations = async () => {
    try {
      setLoading(true);
      const response = await api.get("/allocations");
      setAllocations(response.data);
      const grouped = groupAllocations(response.data);
      setGroupedData(grouped);
      setError(null);
    } catch (err) {
      console.error("Error fetching allocations:", err);
      setError("Failed to load allocation data");
    } finally {
      setLoading(false);
    }
  };

  const groupAllocations = (data) => {
    const grouped = {};
    
    data.forEach(allocation => {
      const building = allocation.buildingName || "Unknown";
      const floor = allocation.floorName || "Unknown";
      const room = allocation.room_number || "Unknown";
      
      if (!grouped[building]) {
        grouped[building] = {};
      }
      if (!grouped[building][floor]) {
        grouped[building][floor] = {};
      }
      if (!grouped[building][floor][room]) {
        grouped[building][floor][room] = [];
      }
      
      grouped[building][floor][room].push(allocation);
    });
    
    return grouped;
  };

  // Get filtered data based on selections
  const getFilteredData = () => {
    let filtered = JSON.parse(JSON.stringify(groupedData));

    if (selectedBuilding !== "all") {
      filtered = {
        [selectedBuilding]: filtered[selectedBuilding] || {}
      };
    }

    if (selectedBuilding !== "all" && selectedFloor !== "all") {
      filtered[selectedBuilding] = {
        [selectedFloor]: filtered[selectedBuilding]?.[selectedFloor] || {}
      };
    }

    if (selectedUser !== "all") {
      // Filter allocations by user
      const tempFiltered = {};
      Object.keys(filtered).forEach(building => {
        Object.keys(filtered[building] || {}).forEach(floor => {
          Object.keys(filtered[building][floor] || {}).forEach(room => {
            const userAllocations = filtered[building][floor][room].filter(
              alloc => alloc.userId === selectedUser
            );
            
            if (userAllocations.length > 0) {
              if (!tempFiltered[building]) tempFiltered[building] = {};
              if (!tempFiltered[building][floor]) tempFiltered[building][floor] = {};
              tempFiltered[building][floor][room] = userAllocations;
            }
          });
        });
      });
      filtered = tempFiltered;
    }

    return filtered;
  };

  // Get unique values for dropdowns
  const getUniqueBuildings = () => Object.keys(groupedData);
  
  const getUniqueFloors = () => {
    if (selectedBuilding === "all") return [];
    return Object.keys(groupedData[selectedBuilding] || {});
  };
  
  const generateLocationCode = (building, floor, room, bed) => {
    // Convert Building (Building-A=1, Building-B=2, etc.)
    let buildingNum = '1';
    if (building) {
      const hyphenMatch = building.match(/-([A-Z])/i);
      if (hyphenMatch) {
        buildingNum = String(hyphenMatch[1].toUpperCase().charCodeAt(0) - 64); // A=1, B=2
      }
    }
    
    // Convert Floor (ground=1, first=2, second=3, etc.)
    let floorNum = '1';
    if (floor) {
      const floorLower = floor.toLowerCase().trim();
      if (floorLower === 'ground') {
        floorNum = '1';
      } else if (floorLower === 'first') {
        floorNum = '2';
      } else if (floorLower === 'second') {
        floorNum = '3';
      }
    }
    
    // Extract room and bed numbers (handle both string and number types)
    const roomNum = String(room).replace(/\D/g, '').padStart(2, '0') || '00';
    const bedNum = String(bed).replace(/\D/g, '').padStart(2, '0') || '00';
    
    // Combine: Building(1) + Floor(1) + Room(2) + Bed(2) = 6 digits
    return `${buildingNum}${floorNum}${roomNum}${bedNum}`;
  };

  const getUniqueUsers = () => {
    const userMap = new Map();
    allocations.forEach(alloc => {
      if (alloc.userId) {
        userMap.set(alloc.userId, alloc.userName || alloc.userId);
      }
    });
    return Array.from(userMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.id.localeCompare(b.id));
  };

  const getFilteredUsers = () => {
    if (!userSearch.trim()) return getUniqueUsers();
    const searchTerm = userSearch.toLowerCase();
    return getUniqueUsers().filter(user => 
      user.id.toLowerCase().includes(searchTerm) || 
      user.name.toLowerCase().includes(searchTerm)
    );
  };

  const downloadExcel = () => {
    const filteredData = getFilteredData();
    const worksheetData = [];
    worksheetData.push(["CAMP MANAGEMENT REPORT"]);
    worksheetData.push(["Company: Lloyds"]);
    worksheetData.push(["Date:", new Date().toLocaleDateString()]);
    
    if (selectedBuilding !== "all") {
      worksheetData.push(["Building Filter:", selectedBuilding]);
    }
    if (selectedFloor !== "all") {
      worksheetData.push(["Floor Filter:", selectedFloor]);
    }
    if (selectedUser !== "all") {
      worksheetData.push(["User Filter:", selectedUser]);
    }
    
    worksheetData.push([]);
    
    Object.keys(filteredData).forEach(building => {
      worksheetData.push([`BUILDING: ${building}`]);
      
      Object.keys(filteredData[building] || {}).forEach(floor => {
        worksheetData.push([`  FLOOR: ${floor}`]);
        
        Object.keys(filteredData[building][floor] || {}).forEach(room => {
          const allocsInRoom = filteredData[building][floor][room];
          worksheetData.push([`    ROOM: ${room}`, `Beds Occupied: ${allocsInRoom.length}`]);
          
          worksheetData.push([
            "User ID", "User Name", "Company", "Contractor", 
            "Bed", "Position", "Start Date", "End Date", "Status"
          ]);
          
          allocsInRoom.forEach(alloc => {
            worksheetData.push([
              alloc.userId,
              alloc.userName,
              alloc.company,
              alloc.contractorName,
              alloc.bunkNumber,
              alloc.position,
              alloc.startDate,
              alloc.endDate,
              alloc.status
            ]);
          });
          
          worksheetData.push([]);
        });
      });
    });
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    worksheet['!cols'] = [
      { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 }
    ];
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Allocations");
    XLSX.writeFile(workbook, `Camp_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const downloadPDF = () => {
    const element = reportRef.current;
    const opt = {
      margin: 10,
      filename: `Camp_Report_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: "portrait", unit: "mm", format: "a4" }
    };
    html2pdf().set(opt).from(element).save();
  };

  const resetFilters = () => {
    setSelectedBuilding("all");
    setSelectedFloor("all");
    setSelectedUser("all");
  };

  if (loading) return <div className="report-container"><p>Loading report data...</p></div>;
  if (error) return <div className="report-container error-message">{error}</div>;

  const filteredData = getFilteredData();
  const buildings = getUniqueBuildings();
  const floors = getUniqueFloors();

  return (
    <div className="report-container">
      {/* Back Button */}
      <div style={{ marginBottom: "15px" }}>
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

      {/* Filter Section */}
      <div className="report-filters">
        <div className="filter-group">
          <label>Building:</label>
          <select value={selectedBuilding} onChange={(e) => {
            setSelectedBuilding(e.target.value);
            setSelectedFloor("all");
          }}>
            <option value="all">All Buildings</option>
            {buildings.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Floor:</label>
          <select 
            value={selectedFloor} 
            onChange={(e) => setSelectedFloor(e.target.value)}
            disabled={selectedBuilding === "all"}
          >
            <option value="all">All Floors</option>
            {floors.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        <div className="filter-group user-filter-group">
          <label>User:</label>
          <div className="user-search-container">
            <input
              type="text"
              placeholder="Search User ID or Name..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              onFocus={() => setShowUserDropdown(true)}
              className="user-search-input"
            />
            {showUserDropdown && (
              <div className="user-dropdown">
                <div 
                  className="user-dropdown-item"
                  onClick={() => {
                    setSelectedUser("all");
                    setUserSearch("");
                    setShowUserDropdown(false);
                  }}
                >
                  <strong>All Users</strong>
                </div>
                {getFilteredUsers().map(user => (
                  <div 
                    key={user.id}
                    className="user-dropdown-item"
                    onClick={() => {
                      setSelectedUser(user.id);
                      setUserSearch(`${user.id} - ${user.name}`);
                      setShowUserDropdown(false);
                    }}
                  >
                    <strong>{user.id}</strong>
                    <span>{user.name}</span>
                  </div>
                ))}
                {getFilteredUsers().length === 0 && (
                  <div className="user-dropdown-item no-results">
                    No users found
                  </div>
                )}
              </div>
            )}
            {selectedUser !== "all" && (
              <button 
                className="user-clear-btn"
                onClick={() => {
                  setSelectedUser("all");
                  setUserSearch("");
                }}
                title="Clear selection"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <button onClick={resetFilters} className="btn-reset">↻ Reset Filters</button>
      </div>

      {/* Controls Section */}
      <div className="report-controls">
        <button onClick={downloadExcel} className="btn-download excel">
          📊 Download Excel
        </button>
        <button onClick={downloadPDF} className="btn-download pdf">
          📄 Download PDF
        </button>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="report-content">
        <div className="report-header">
          <div className="report-header-left">
            <img src={logo} alt="Lloyds Logo" className="report-logo" />
            <h1>CAMP MANAGEMENT REPORT</h1>
          </div>
          <div className="report-header-right">
            <p><strong>Company:</strong> Lloyds</p>
            <p><strong>Report Date:</strong> {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="report-body">
          {allocations.length === 0 || Object.keys(filteredData).length === 0 ? (
            <p className="no-data">No data available for the selected filters</p>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Allocation Code</th>
                  <th>User ID</th>
                  <th>User Name</th>
                  <th>Company</th>
                  <th>Contractor</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const rows = [];
                  Object.keys(filteredData).forEach(building => {
                    Object.keys(filteredData[building] || {}).forEach(floor => {
                      Object.keys(filteredData[building][floor] || {}).forEach(room => {
                        const allocsInRoom = filteredData[building][floor][room];
                        allocsInRoom.forEach((alloc, idx) => {
                          const allocationCode = generateLocationCode(building, floor, room, alloc.bunk_number);
                          rows.push(
                            <tr key={`${building}-${floor}-${room}-${idx}`}>
                              <td><strong className="allocation-code">{allocationCode}</strong></td>
                              <td><strong>{alloc.userId}</strong></td>
                              <td>{alloc.userName}</td>
                              <td>{alloc.company}</td>
                              <td>{alloc.contractorName}</td>
                              <td>
                                {alloc.start_date && alloc.end_date ? (
                                  <div style={{ fontSize: "13px", lineHeight: "1.4" }}>
                                    <div><strong>From:</strong> {formatDate(alloc.start_date)}</div>
                                    <div><strong>To:</strong> {formatDate(alloc.end_date)}</div>
                                    <div style={{ color: "#666", fontSize: "11px" }}>
                                      ({Math.ceil((new Date(alloc.end_date) - new Date(alloc.start_date)) / (1000 * 60 * 60 * 24))} days)
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ color: "#999", fontSize: "12px", fontStyle: "italic" }}>No duration set</div>
                                )}
                              </td>
                              <td className={`status-${alloc.status?.toLowerCase()}`}>
                                {alloc.status}
                              </td>
                            </tr>
                          );
                        });
                      });
                    });
                  });
                  return rows;
                })()}
              </tbody>
            </table>
          )}
        </div>

        <div className="report-footer">
          <p>This is an auto-generated Camp Management Report</p>
          <p>Generated on: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

export default ReportPage;
