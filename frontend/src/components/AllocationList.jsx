import React, { useMemo, useState } from "react";
import { MdBlock, MdEdit, MdLogout } from "react-icons/md";
import api from "../services/api";
import "../styles/allocationList.css";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const toInputDate = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

const isExpired = (endDate) => endDate && new Date(endDate) < new Date();

const isCheckedOutStatus = (status) => {
  const normalized = (status || "").toUpperCase();
  return normalized === "CHECKED_OUT" || normalized === "RELEASED";
};

const statusPillStyle = (status) => {
  if (isCheckedOutStatus(status)) {
    return {
      color: "#b45309",
      backgroundColor: "#fef3c7"
    };
  }

  return {
    color: "#166534",
    backgroundColor: "#dcfce7"
  };
};

const blacklistStatusPillStyle = {
  color: "#b91c1c",
  backgroundColor: "#fee2e2"
};

function AllocationList({ allocations = [], onRefresh }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [editingAllocation, setEditingAllocation] = useState(null);
  const [saving, setSaving] = useState(false);
  const [blacklisting, setBlacklisting] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState("");
  const [formData, setFormData] = useState({
    userName: "",
    company: "",
    contractorName: "",
    startDate: "",
    endDate: "",
    remarks: ""
  });

  const filteredAllocations = useMemo(() => {
    if (!Array.isArray(allocations) || allocations.length === 0) {
      return [];
    }

    let results = [...allocations];

    if (filterType === "expired") {
      results = results.filter((alloc) => isExpired(alloc.end_date));
    } else if (filterType === "active") {
      results = results.filter((alloc) => !isExpired(alloc.end_date));
    } else if (filterType === "checkedOut") {
      results = results.filter((alloc) =>
        isCheckedOutStatus(alloc.statusDisplay || alloc.status)
      );
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      results = results.filter((alloc) => {
        const floorLabel = String(alloc.floorName ?? alloc.floor_number ?? "");
        return (
          alloc.userId?.toLowerCase().includes(search) ||
          alloc.userName?.toLowerCase().includes(search) ||
          alloc.company?.toLowerCase().includes(search) ||
          alloc.contractorName?.toLowerCase().includes(search) ||
          alloc.buildingName?.toLowerCase().includes(search) ||
          floorLabel.toLowerCase().includes(search) ||
          alloc.room_number?.toString().includes(search) ||
          alloc.bed_number?.toString().includes(search) ||
          alloc.allocation_code?.toLowerCase().includes(search) ||
          (alloc.isBlacklisted ? "blacklisted".includes(search) : false)
        );
      });
    }

    return results;
  }, [allocations, searchTerm, filterType]);

  const clearSearch = () => setSearchTerm("");

  const openEditModal = (allocation) => {
    setEditingAllocation(allocation);
    setFormData({
      userName: allocation.userName || "",
      company: allocation.company || "",
      contractorName: allocation.contractorName || "",
      startDate: toInputDate(allocation.start_date),
      endDate: toInputDate(allocation.end_date),
      remarks: allocation.remarks || ""
    });
    setBlacklistReason("");
  };

  const closeEditModal = () => {
    setEditingAllocation(null);
    setBlacklistReason("");
    setSaving(false);
    setBlacklisting(false);
  };

  const handleSave = async (checkout = false) => {
    if (!editingAllocation) return;

    if (
      formData.startDate &&
      formData.endDate &&
      new Date(formData.startDate) >= new Date(formData.endDate)
    ) {
      alert("End date must be after start date");
      return;
    }

    setSaving(true);
    try {
      await api.put(`/allocations/${editingAllocation.id}`, {
        ...formData,
        checkout
      });

      alert(checkout ? "Checked out successfully" : "Allocation updated");
      closeEditModal();
      if (typeof onRefresh === "function") {
        await onRefresh();
      }
    } catch (err) {
      console.error("Edit allocation error:", err);
      alert(err.response?.data?.error || "Failed to update allocation");
      setSaving(false);
    }
  };

  const handleBlacklist = async () => {
    if (!editingAllocation?.userId || !editingAllocation?.userName) {
      alert("Missing user details for blacklist");
      return;
    }

    if (!blacklistReason.trim()) {
      alert("Please provide a reason for blacklisting");
      return;
    }

    setBlacklisting(true);
    try {
      await api.post("/blacklist/add", {
        userId: editingAllocation.userId,
        userName: formData.userName || editingAllocation.userName,
        company: formData.company || editingAllocation.company,
        reason: blacklistReason.trim(),
        blacklistedBy: "admin"
      });

      alert("User blacklisted successfully");
      setBlacklistReason("");
      if (typeof onRefresh === "function") {
        await onRefresh();
      }
    } catch (err) {
      console.error("Blacklist from allocation error:", err);
      alert(err.response?.data?.error || "Failed to blacklist user");
    } finally {
      setBlacklisting(false);
    }
  };

  if (!Array.isArray(allocations) || allocations.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Current Allocations</h2>
        <p style={{ color: "#666", fontSize: "16px" }}>No allocations found.</p>
        <p style={{ color: "#999", fontSize: "14px" }}>
          Use Booking to create new allocations.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "15px"
        }}
      >
        <h2>
          Current Allocations ({filteredAllocations.length} of {allocations.length})
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            type="text"
            placeholder="Search by user, company, location, code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "2px solid #ddd",
              borderRadius: "6px",
              width: "300px",
              fontSize: "14px",
              outline: "none"
            }}
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
              outline: "none"
            }}
          >
            <option value="all">All Allocations</option>
            <option value="active">Active Duration</option>
            <option value="expired">Expired Duration</option>
            <option value="checkedOut">Checked Out</option>
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

      {searchTerm && (
        <div
          style={{
            marginBottom: "15px",
            padding: "8px 12px",
            backgroundColor: "#f8f9fa",
            borderRadius: "4px",
            fontSize: "14px",
            color: "#666"
          }}
        >
          {filteredAllocations.length > 0
            ? `Found ${filteredAllocations.length} allocation(s) matching "${searchTerm}"`
            : `No allocations found matching "${searchTerm}"`}
        </div>
      )}

      {filteredAllocations.length === 0 && searchTerm ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          <p style={{ fontSize: "16px" }}>No allocations match your search.</p>
        </div>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #ddd",
            marginTop: "20px",
            backgroundColor: "white"
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f8f9fa" }}>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>
                User ID
              </th>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>
                Name
              </th>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>
                Company
              </th>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>
                Contractor
              </th>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>
                Bed Location
              </th>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>
                Duration
              </th>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>
                Remarks
              </th>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "right" }}>
                Rent
              </th>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "center" }}>
                Code
              </th>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "center" }}>
                Status
              </th>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "center" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAllocations.map((alloc) => {
              const floorLabel = alloc.floorName ?? alloc.floor_number ?? "-";
              const effectiveStatus = alloc.statusDisplay || alloc.status;
              const isCheckedOut = isCheckedOutStatus(effectiveStatus);
              return (
                <tr key={alloc.id}>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>{alloc.userId}</td>
                  <td style={{ border: "1px solid #ddd", padding: "10px", fontWeight: "500" }}>
                    {alloc.userName}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>{alloc.company}</td>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                    {alloc.contractorName || "-"}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                    <div style={{ fontSize: "14px" }}>
                      <strong>{alloc.buildingName}</strong>
                      <br />
                      Floor {floorLabel} - Room {alloc.room_number}
                      <br />
                      Bed {alloc.bed_number}
                    </div>
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                    {alloc.start_date && alloc.end_date ? (
                      <>
                        <div style={{ fontSize: "14px" }}>
                          <div>
                            <strong>From:</strong> {formatDate(alloc.start_date)}
                          </div>
                          <div>
                            <strong>To:</strong> {formatDate(alloc.end_date)}
                          </div>
                          <div style={{ color: "#666", fontSize: "12px" }}>
                            (
                            {Math.ceil(
                              (new Date(alloc.end_date) - new Date(alloc.start_date)) /
                                (1000 * 60 * 60 * 24)
                            )}{" "}
                            days)
                          </div>
                        </div>
                        {isExpired(alloc.end_date) && !isCheckedOut && (
                          <div
                            style={{
                              color: "#d32f2f",
                              fontWeight: "bold",
                              marginTop: "8px",
                              fontSize: "12px"
                            }}
                          >
                            Duration Expired
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ color: "#999", fontStyle: "italic" }}>No duration set</div>
                    )}
                  </td>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "10px",
                      fontSize: "14px",
                      color: "#555",
                      maxWidth: "200px"
                    }}
                  >
                    {alloc.remarks ? (
                      <div style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                        {alloc.remarks}
                      </div>
                    ) : (
                      <div style={{ color: "#999", fontStyle: "italic" }}>-</div>
                    )}
                  </td>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "10px",
                      textAlign: "right",
                      fontWeight: "600"
                    }}
                  >
                    {Number(alloc.rent ?? 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2
                    })}
                  </td>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "10px",
                      textAlign: "center",
                      fontWeight: "700"
                    }}
                  >
                    {alloc.allocation_code || "-"}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "10px", textAlign: "center" }}>
                    <span
                      title={alloc.isBlacklisted ? alloc.blacklistReason || "User is blacklisted" : ""}
                      style={{
                        ...(alloc.isBlacklisted
                          ? blacklistStatusPillStyle
                          : statusPillStyle(effectiveStatus)),
                        fontWeight: "bold",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px"
                      }}
                    >
                      {alloc.isBlacklisted
                        ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <MdBlock size={12} />
                            BLACKLISTED
                          </span>
                        )
                        : isCheckedOut
                          ? "CHECKED_OUT"
                          : effectiveStatus}
                    </span>
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "10px", textAlign: "center" }}>
                    <button
                      type="button"
                      className="allocation-action-btn"
                      onClick={() => openEditModal(alloc)}
                      title="Edit allocation"
                    >
                      <MdEdit size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {editingAllocation && (
        <div className="allocation-modal-overlay">
          <div className="allocation-modal">
            <h3>Edit Allocation</h3>

            <div className="allocation-form-grid">
              <label>
                User Name
                <input
                  type="text"
                  value={formData.userName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, userName: e.target.value }))
                  }
                />
              </label>

              <label>
                Company
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, company: e.target.value }))
                  }
                />
              </label>

              <label>
                Contractor Name
                <input
                  type="text"
                  value={formData.contractorName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contractorName: e.target.value
                    }))
                  }
                />
              </label>

              <label>
                Start Date
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                />
              </label>

              <label>
                End Date
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                />
              </label>
            </div>

            <label className="allocation-remarks-field">
              Remarks
              <textarea
                rows={3}
                value={formData.remarks}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, remarks: e.target.value }))
                }
              />
            </label>

            <div className="allocation-modal-divider" />

            <label className="allocation-remarks-field">
              Blacklist Reason
              <textarea
                rows={2}
                placeholder="Reason for blacklisting this user"
                value={blacklistReason}
                onChange={(e) => setBlacklistReason(e.target.value)}
              />
            </label>

            <div className="allocation-modal-actions">
              <button
                type="button"
                className="allocation-btn allocation-btn-secondary"
                onClick={closeEditModal}
                disabled={saving || blacklisting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="allocation-btn allocation-btn-save"
                onClick={() => handleSave(false)}
                disabled={saving || blacklisting}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className="allocation-btn allocation-btn-checkout"
                onClick={() => handleSave(true)}
                disabled={saving || blacklisting}
              >
                <MdLogout size={16} />
                Checkout
              </button>
              <button
                type="button"
                className="allocation-btn allocation-btn-blacklist"
                onClick={handleBlacklist}
                disabled={saving || blacklisting}
              >
                <MdBlock size={16} />
                {blacklisting ? "Blacklisting..." : "Blacklist"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllocationList;
