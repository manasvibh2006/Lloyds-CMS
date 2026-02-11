import { useState } from "react";
import "../styles/userInput.css";
import api from "../services/api"; // Import the API service

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
};

function SettingsPage() {
  const [activeView, setActiveView] = useState("menu"); // menu, blacklist, changePassword
  const [blacklistedUsers, setBlacklistedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState(null);

  const fetchBlacklistedUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/blacklist/all");
      const data = response.data;
      setBlacklistedUsers(data);
    } catch (error) {
      console.error('Error fetching blacklist:', error);
      setError(error.response?.data?.error || error.message || "Failed to load blacklisted users");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to remove ${userName} (${userId}) from the blacklist?`)) {
      return;
    }

    setRemoving(userId);
    try {
      // Use the API service for DELETE request
      await api.delete(`/blacklist/remove/${userId}`);
      // Assuming 'api' service handles non-2xx responses by throwing an error,
      // so no explicit 'response.ok' check is needed here.

      alert('User removed from blacklist successfully');
      fetchBlacklistedUsers(); // Refresh list
    } catch (error) {
      console.error('Error removing from blacklist:', error);
      alert('Failed to remove user from blacklist');
    } finally {
      setRemoving(null);
    }
  };

  // Render Settings Menu
  if (activeView === "menu") {
    return (
      <div style={{ padding: "30px", maxWidth: "900px" }}>
        <h2 style={{ 
          marginBottom: "8px",
          fontSize: "24px",
          fontWeight: "600",
          color: "#1f2937"
        }}>Settings</h2>
        <p style={{ 
          marginBottom: "30px",
          fontSize: "14px",
          color: "#6b7280"
        }}>Manage your account settings and preferences</p>
        
        <div style={{
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          overflow: "hidden"
        }}>
          {/* Blacklisted Users Option */}
          <div 
            onClick={() => {
              setActiveView("blacklist");
              fetchBlacklistedUsers();
            }}
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid #e5e7eb",
              cursor: "pointer",
              transition: "background-color 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f9fafb";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <div>
              <h3 style={{ 
                margin: "0 0 4px 0",
                fontSize: "16px",
                fontWeight: "500",
                color: "#111827"
              }}>Blacklisted Users</h3>
              <p style={{ 
                margin: 0,
                fontSize: "14px",
                color: "#6b7280"
              }}>View and manage blacklisted users</p>
            </div>
            <span style={{ 
              fontSize: "18px",
              color: "#9ca3af"
            }}>›</span>
          </div>

          {/* Change Password Option */}
          <div 
            onClick={() => setActiveView("changePassword")}
            style={{
              padding: "20px 24px",
              cursor: "pointer",
              transition: "background-color 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f9fafb";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <div>
              <h3 style={{ 
                margin: "0 0 4px 0",
                fontSize: "16px",
                fontWeight: "500",
                color: "#111827"
              }}>Change Password</h3>
              <p style={{ 
                margin: 0,
                fontSize: "14px",
                color: "#6b7280"
              }}>Update your account password</p>
            </div>
            <span style={{ 
              fontSize: "18px",
              color: "#9ca3af"
            }}>›</span>
          </div>
        </div>
      </div>
    );
  }

  // Render Change Password View
  if (activeView === "changePassword") {
    return (
      <div style={{ padding: "30px", maxWidth: "900px" }}>
        <button
          onClick={() => setActiveView("menu")}
          style={{
            marginBottom: "24px",
            padding: "8px 12px",
            backgroundColor: "transparent",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            color: "#6b7280",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#111827";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#6b7280";
          }}
        >
          ← Back to Settings
        </button>
        
        <h2 style={{ 
          marginBottom: "8px",
          fontSize: "24px",
          fontWeight: "600",
          color: "#1f2937"
        }}>Change Password</h2>
        <p style={{ 
          marginBottom: "24px",
          fontSize: "14px",
          color: "#6b7280"
        }}>Update your account password</p>
        
        <div style={{
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "40px"
        }}>
          <p style={{ 
            color: "#6b7280", 
            textAlign: "center",
            fontSize: "14px"
          }}>
            Password change functionality will be available soon.
          </p>
        </div>
      </div>
    );
  }

  // Render Blacklisted Users View
  return (
    <div style={{ padding: "30px", maxWidth: "1400px" }}>
      <button
        onClick={() => setActiveView("menu")}
        style={{
          marginBottom: "24px",
          padding: "8px 12px",
          backgroundColor: "transparent",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "14px",
          color: "#6b7280",
          display: "flex",
          alignItems: "center",
          gap: "4px"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#111827";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#6b7280";
        }}
      >
        ← Back to Settings
      </button>
      
      <h2 style={{ 
        marginBottom: "8px",
        fontSize: "24px",
        fontWeight: "600",
        color: "#1f2937"
      }}>Blacklisted Users</h2>
      <p style={{ 
        marginBottom: "24px",
        fontSize: "14px",
        color: "#6b7280"
      }}>View and manage users who are restricted from making bookings</p>
      
      <div style={{
        backgroundColor: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        overflow: "hidden"
      }}>
        <div style={{ padding: "24px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#6b7280", fontSize: "14px" }}>
              Loading blacklisted users...
            </div>
          ) : error ? (
            <div style={{ 
              textAlign: "center", 
              padding: "32px", 
              color: "#dc2626",
              backgroundColor: "#fef2f2",
              borderRadius: "6px",
              border: "1px solid #fecaca"
            }}>
              <p style={{ fontWeight: "500", marginBottom: "8px", fontSize: "14px" }}>Error loading data</p>
              <p style={{ fontSize: "13px", color: "#991b1b", marginBottom: "16px" }}>{error}</p>
              <button
                onClick={fetchBlacklistedUsers}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "500"
                }}
              >
                Retry
              </button>
            </div>
          ) : blacklistedUsers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p style={{ color: "#6b7280", fontSize: "14px" }}>No users are currently blacklisted.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse"
              }}>
                <thead>
                  <tr style={{ 
                    backgroundColor: "#f9fafb",
                    borderBottom: "1px solid #e5e7eb"
                  }}>
                    <th style={{ 
                      padding: "12px 16px", 
                      textAlign: "left",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#374151"
                    }}>User ID</th>
                    <th style={{ 
                      padding: "12px 16px", 
                      textAlign: "left",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#374151"
                    }}>Name</th>
                    <th style={{ 
                      padding: "12px 16px", 
                      textAlign: "left",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#374151"
                    }}>Company</th>
                    <th style={{ 
                      padding: "12px 16px", 
                      textAlign: "left",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#374151"
                    }}>Reason</th>
                    <th style={{ 
                      padding: "12px 16px", 
                      textAlign: "left",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#374151"
                    }}>Blacklisted By</th>
                    <th style={{ 
                      padding: "12px 16px", 
                      textAlign: "left",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#374151"
                    }}>Date</th>
                    <th style={{ 
                      padding: "12px 16px", 
                      textAlign: "center",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#374151"
                    }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {blacklistedUsers.map((user, index) => (
                    <tr key={user.id} style={{ 
                      borderBottom: index < blacklistedUsers.length - 1 ? "1px solid #f3f4f6" : "none"
                    }}>
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "#111827" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{
                            backgroundColor: '#fef2f2',
                            color: '#dc2626',
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: '600',
                            border: '1px solid #fecaca'
                          }}>
                            BLOCKED
                          </span>
                          {user.user_id}
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "#111827", fontWeight: "500" }}>
                        {user.user_name}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "#6b7280" }}>
                        {user.company || '-'}
                      </td>
                      <td style={{ padding: "14px 16px", maxWidth: "300px" }}>
                        <div style={{ 
                          fontSize: "13px",
                          color: "#374151",
                          lineHeight: "1.5"
                        }}>
                          {user.reason}
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "#6b7280" }}>
                        {user.blacklisted_by || 'admin'}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "12px", color: "#9ca3af" }}>
                        {formatDate(user.blacklisted_at)}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <button
                          onClick={() => handleRemove(user.user_id, user.user_name)}
                          disabled={removing === user.user_id}
                          style={{
                            padding: "6px 14px",
                            backgroundColor: removing === user.user_id ? "#e5e7eb" : "transparent",
                            color: removing === user.user_id ? "#9ca3af" : "#059669",
                            border: "1px solid",
                            borderColor: removing === user.user_id ? "#e5e7eb" : "#d1fae5",
                            borderRadius: "6px",
                            cursor: removing === user.user_id ? "not-allowed" : "pointer",
                            fontSize: "12px",
                            fontWeight: "500",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (removing !== user.user_id) {
                              e.target.style.backgroundColor = "#ecfdf5";
                              e.target.style.borderColor = "#a7f3d0";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (removing !== user.user_id) {
                              e.target.style.backgroundColor = "transparent";
                              e.target.style.borderColor = "#d1fae5";
                            }
                          }}
                        >
                          {removing === user.user_id ? "Removing..." : "Remove"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
