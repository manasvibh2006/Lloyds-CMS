import React, { useState, useMemo } from 'react';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const isExpired = (endDate) => {
  return new Date(endDate) < new Date();
};

function AllocationList({ allocations = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'expired', 'active'

  // Filter allocations based on search term and filter type
  const filteredAllocations = useMemo(() => {
    if (!Array.isArray(allocations) || allocations.length === 0) {
      return [];
    }

    let results = [...allocations];
    
    // Filter by expired/active status
    if (filterType === 'expired') {
      results = results.filter(alloc => isExpired(alloc.end_date));
    } else if (filterType === 'active') {
      results = results.filter(alloc => !isExpired(alloc.end_date));
    }
    
    // Then apply search
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      results = results.filter(alloc => 
        alloc.userId?.toLowerCase().includes(search) ||
        alloc.userName?.toLowerCase().includes(search) ||
        alloc.company?.toLowerCase().includes(search) ||
        alloc.contractorName?.toLowerCase().includes(search) ||
        alloc.buildingName?.toLowerCase().includes(search) ||
        alloc.floorName?.toLowerCase().includes(search) ||
        alloc.room_number?.toString().includes(search) ||
        alloc.bunk_number?.toString().includes(search)
      );
    }
    
    return results;
  }, [allocations, searchTerm, filterType]);

  const clearSearch = () => setSearchTerm('');

  if (!Array.isArray(allocations) || allocations.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Current Allocations</h2>
        <p style={{ color: "#666", fontSize: "16px" }}>No allocations found.</p>
        <p style={{ color: "#999", fontSize: "14px" }}>Use the Bookings menu to create new allocations.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
        <h2>Current Allocations ({filteredAllocations.length} of {allocations.length})</h2>
        
        {/* Search Bar & Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            type="text"
            placeholder="Search by name, user ID, company, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "2px solid #ddd",
              borderRadius: "6px",
              width: "300px",
              fontSize: "14px",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => e.target.style.borderColor = "#007bff"}
            onBlur={(e) => e.target.style.borderColor = "#ddd"}
          />
          
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "2px solid #ddd",
              fontSize: "14px",
              backgroundColor: "white",
              cursor: "pointer",
              outline: "none",
              transition: "border-color 0.2s"
            }}
            onFocus={(e) => e.target.style.borderColor = "#007bff"}
            onBlur={(e) => e.target.style.borderColor = "#ddd"}
          >
            <option value="all">All Allocations</option>
            <option value="active">Active Duration</option>
            <option value="expired">Expired Duration</option>
          </select>
          
          {searchTerm && (
            <button
              onClick={clearSearch}
              style={{
                padding: "8px 12px",
                backgroundColor: "#f8f9fa",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                color: "#666"
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div style={{ 
          marginBottom: "15px", 
          padding: "8px 12px", 
          backgroundColor: "#f8f9fa", 
          borderRadius: "4px",
          fontSize: "14px",
          color: "#666"
        }}>
          {filteredAllocations.length > 0 
            ? `Found ${filteredAllocations.length} allocation(s) matching "${searchTerm}"`
            : `No allocations found matching "${searchTerm}"`
          }
        </div>
      )}

      {filteredAllocations.length === 0 && searchTerm ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          <p style={{ fontSize: "16px" }}>No allocations match your search.</p>
          <p style={{ fontSize: "14px" }}>Try searching by user name, ID, company, or location.</p>
        </div>
      ) : (
      <table style={{ 
        width: "100%", 
        borderCollapse: "collapse", 
        border: "1px solid #ddd",
        marginTop: "20px",
        backgroundColor: "white"
      }}>
        <thead>
          <tr style={{ backgroundColor: "#f8f9fa" }}>
            <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>User ID</th>
            <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>Name</th>
            <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>Company</th>
            <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>Contractor</th>
            <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>Bed Location</th>
            <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>Duration</th>
            <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>Remarks</th>
            <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "center" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredAllocations.map(alloc => (
            <tr key={alloc.id} style={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
              <td style={{ border: "1px solid #ddd", padding: "10px" }}>{alloc.userId}</td>
              <td style={{ border: "1px solid #ddd", padding: "10px", fontWeight: "500" }}>{alloc.userName}</td>
              <td style={{ border: "1px solid #ddd", padding: "10px" }}>{alloc.company}</td>
              <td style={{ border: "1px solid #ddd", padding: "10px" }}>{alloc.contractorName || '-'}</td>
              <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                <div style={{ fontSize: "14px" }}>
                  <strong>{alloc.buildingName}</strong><br/>
                  {alloc.floorName} - Room {alloc.room_number}<br/>
                  Bunk {alloc.bunk_number}{alloc.position}
                </div>
              </td>
              <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                {alloc.start_date && alloc.end_date ? (
                  <>
                    <div style={{ fontSize: "14px" }}>
                      <div><strong>From:</strong> {formatDate(alloc.start_date)}</div>
                      <div><strong>To:</strong> {formatDate(alloc.end_date)}</div>
                      <div style={{ color: "#666", fontSize: "12px" }}>
                        ({Math.ceil((new Date(alloc.end_date) - new Date(alloc.start_date)) / (1000 * 60 * 60 * 24))} days)
                      </div>
                    </div>
                    {isExpired(alloc.end_date) && (
                      <div style={{ color: "#d32f2f", fontWeight: "bold", marginTop: "8px", fontSize: "12px" }}>
                        ⚠️ Duration Expired
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ color: "#999", fontStyle: "italic" }}>No duration set</div>
                )}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "10px", fontSize: "14px", color: "#555", maxWidth: "200px" }}>
                {alloc.remarks ? (
                  <div style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{alloc.remarks}</div>
                ) : (
                  <div style={{ color: "#999", fontStyle: "italic" }}>-</div>
                )}
              </td>
              <td style={{ 
                border: "1px solid #ddd", 
                padding: "10px", 
                textAlign: "center"
              }}>
                <span style={{ 
                  color: "#22c55e", 
                  fontWeight: "bold",
                  backgroundColor: "#dcfce7",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "12px"
                }}>
                  {alloc.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  );
}

export default AllocationList;