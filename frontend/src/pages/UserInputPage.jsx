import { useState } from "react";
import FormRow from "../components/FormRow";
import api from "../services/api";
import "../styles/form.css";
import "../styles/userInput.css";

function UserInputPage({ bookingData, onSuccess }) {
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [company, setCompany] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const [blacklistInfo, setBlacklistInfo] = useState(null);
  const [lastBlacklistAlertedUser, setLastBlacklistAlertedUser] = useState("");
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState("");
  const [blacklisting, setBlacklisting] = useState(false);

  const checkBlacklist = async (id) => {
    if (!id || id.length < 3) {
      setIsBlacklisted(false);
      setBlacklistInfo(null);
      return;
    }

    try {
      const response = await api.get(`/blacklist/check/${id}`);
      const data = response.data;
      if (data.isBlacklisted) {
        setIsBlacklisted(true);
        setBlacklistInfo(data);
        if (id !== lastBlacklistAlertedUser) {
          alert(
            `User ${id} is blacklisted and cannot be booked.\nReason: ${data.reason || "-"}`
          );
          setLastBlacklistAlertedUser(id);
        }
      } else {
        setIsBlacklisted(false);
        setBlacklistInfo(null);
        if (id !== lastBlacklistAlertedUser) {
          setLastBlacklistAlertedUser("");
        }
      }
    } catch (err) {
      console.error("Blacklist check error:", err);
    }
  };

  const handleUserIdChange = (value) => {
    setUserId(value);
    checkBlacklist(value);
  };

  const handleBlacklist = async () => {
    if (!userId || !userName) {
      alert("Please enter User ID and User Name first");
      return;
    }
    if (!blacklistReason.trim()) {
      alert("Please provide a reason for blacklisting");
      return;
    }

    setBlacklisting(true);
    try {
      await api.post("/blacklist/add", {
        userId,
        userName,
        company,
        reason: blacklistReason,
        blacklistedBy: "admin"
      });
      alert("User blacklisted successfully");
      setShowBlacklistModal(false);
      setBlacklistReason("");
      checkBlacklist(userId);
    } catch (err) {
      console.error("Blacklist error:", err);
      alert(err.response?.data?.error || "Failed to blacklist user");
    } finally {
      setBlacklisting(false);
    }
  };

  const handleSubmit = async () => {
    if (!bookingData?.bedId) {
      alert("Booking data missing. Please select a bed again.");
      return;
    }
    if (!userId || !userName || !company || !startDate || !endDate) {
      alert("Please fill all required fields");
      return;
    }
    if (isBlacklisted) {
      alert(`Cannot allocate. User is blacklisted.\nReason: ${blacklistInfo?.reason || "-"}`);
      return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      alert("End date must be after start date");
      return;
    }

    setLoading(true);
    try {
      await api.post("/allocations", {
        userId,
        userName,
        company,
        contractorName,
        bedId: bookingData.bedId,
        startDate,
        endDate,
        remarks
      });
      alert("Allocation successful");
      onSuccess();
    } catch (err) {
      console.error("Allocation error:", err);
      alert(err.response?.data?.error || "Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-card">
      <div className="user-card-header">User Details</div>

      <div className="user-card-body">
        {isBlacklisted && blacklistInfo && (
          <div style={{ backgroundColor: "#fee", border: "2px solid #dc2626", borderRadius: "8px", padding: "15px", marginBottom: "20px", color: "#991b1b" }}>
            <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "8px" }}>BLACKLISTED USER</div>
            <div style={{ fontSize: "14px", marginBottom: "5px" }}>
              <strong>Reason:</strong> {blacklistInfo.reason}
            </div>
          </div>
        )}

        <FormRow label="User ID" required>
          <input type="text" value={userId} onChange={(e) => handleUserIdChange(e.target.value)} style={isBlacklisted ? { borderColor: "#dc2626" } : {}} />
        </FormRow>

        <FormRow label="User Name" required>
          <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} />
        </FormRow>

        <FormRow label="Company Name" required>
          <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} />
        </FormRow>

        <FormRow label="Contractor Name">
          <input type="text" value={contractorName} onChange={(e) => setContractorName(e.target.value)} />
        </FormRow>

        <FormRow label="Start date" required>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </FormRow>

        <FormRow label="End date" required>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </FormRow>

        <FormRow label="Remarks">
          <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </FormRow>

        <div className="user-button-group">
          <button className="btn-submit" onClick={handleSubmit} disabled={loading || isBlacklisted} style={isBlacklisted ? { backgroundColor: "#ccc", cursor: "not-allowed" } : {}}>
            {loading ? "Saving..." : "Submit"}
          </button>

          <button
            type="button"
            onClick={() => setShowBlacklistModal(true)}
            disabled={!userId || !userName}
            style={{
              padding: "10px 20px",
              backgroundColor: !userId || !userName ? "#ccc" : "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: !userId || !userName ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "600",
              marginLeft: "10px"
            }}
          >
            Blacklist User
          </button>
        </div>
      </div>

      {showBlacklistModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "10px", maxWidth: "500px", width: "90%" }}>
            <h3 style={{ marginTop: 0, color: "#dc2626" }}>Blacklist User</h3>
            <p style={{ marginBottom: "20px", color: "#666" }}>
              You are about to blacklist <strong>{userName}</strong> (ID: {userId}).
            </p>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
              Reason for Blacklisting: <span style={{ color: "red" }}>*</span>
            </label>
            <textarea
              value={blacklistReason}
              onChange={(e) => setBlacklistReason(e.target.value)}
              placeholder="Enter reason..."
              rows={4}
              style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd", fontSize: "14px", resize: "vertical", marginBottom: "20px" }}
            />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => { setShowBlacklistModal(false); setBlacklistReason(""); }} disabled={blacklisting}>
                Cancel
              </button>
              <button onClick={handleBlacklist} disabled={blacklisting || !blacklistReason.trim()}>
                {blacklisting ? "Blacklisting..." : "Confirm Blacklist"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserInputPage;
