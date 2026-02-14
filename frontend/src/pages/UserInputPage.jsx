import { useEffect, useState } from "react";
import FormRow from "../components/FormRow";
import api from "../services/api";
import "../styles/form.css";
import "../styles/userInput.css";

const getTodayDateString = () => new Date().toISOString().split("T")[0];
const toIndianDate = (isoDate) => {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
};

function UserInputPage({ bookingData, onSuccess }) {
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [company, setCompany] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [startDate] = useState(getTodayDateString());
  const [endDate, setEndDate] = useState("");
  const [rent, setRent] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const [blacklistInfo, setBlacklistInfo] = useState(null);
  const [lastBlacklistAlertedUser, setLastBlacklistAlertedUser] = useState("");
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState("");
  const [blacklisting, setBlacklisting] = useState(false);
  const [bloodGroup, setBloodGroup] = useState("");
  const [age, setAge] = useState("");
  const [designation, setDesignation] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const [contractorOptions, setContractorOptions] = useState([]);
  const [designationOptions, setDesignationOptions] = useState([]);
  const [showDesignationDropdown, setShowDesignationDropdown] = useState(false);

  useEffect(() => {
    const loadLookupData = async () => {
      try {
        const [contractorsRes, allocationsRes] = await Promise.all([
          api.get("/contractors"),
          api.get("/allocations")
        ]);
        const contractorRows = contractorsRes.data || [];
        const allocationRows = allocationsRes.data || [];

        const uniqueNames = Array.from(
          new Set(
            contractorRows
              .map((item) => (item.name || "").trim())
              .filter((name) => name)
          )
        ).sort((a, b) => a.localeCompare(b));

        const uniqueDesignations = Array.from(
          new Set(
            allocationRows
              .map((item) => (item.designation || "").trim())
              .filter((name) => name)
          )
        ).sort((a, b) => a.localeCompare(b));

        setContractorOptions(uniqueNames);
        setDesignationOptions(uniqueDesignations);
      } catch (err) {
        console.error("Failed to load booking lookup data:", err);
      }
    };

    loadLookupData();
  }, []);

  const filteredDesignations = designationOptions.filter((name) =>
    name.toLowerCase().includes(designation.toLowerCase().trim())
  );


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

  const preventManualDateEntry = (e) => {
    const allowedKeys = [
      "Tab",
      "Shift",
      "Control",
      "Alt",
      "Meta",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown"
    ];

    if (!allowedKeys.includes(e.key)) {
      e.preventDefault();
    }
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
    if (
      !userId ||
      !userName ||
      !company ||
      !contractorName ||
      !startDate ||
      !endDate ||
      !bloodGroup ||
      !age ||
      !designation ||
      !emergencyPhone ||
      !aadharNumber
    ) {
      alert("Please fill all required fields");
      return;
    }
    if (!/^\d{10}$/.test(emergencyPhone)) {
      alert("Emergency phone must be 10 digits");
      return;
    }
    if (!contractorOptions.includes(contractorName)) {
      alert("Please select a valid contractor from the Contractors section list.");
      return;
    }
    if (!/^\d{12}$/.test(aadharNumber)) {
      alert("Aadhar number must be 12 digits");
      return;
    }
    const parsedAge = Number(age);
    if (!Number.isInteger(parsedAge) || parsedAge < 1 || parsedAge > 62) {
      alert("Age must be between 1 and 62");
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
        rent: rent ? Number(rent) : 0,
        remarks,
        bloodGroup,
        age: parsedAge,
        designation,
        emergencyPhone,
        aadharNumber
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

        <div className="user-form-grid">
          <FormRow label="Worker ID" required>
            <input type="text" value={userId} onChange={(e) => handleUserIdChange(e.target.value)} style={isBlacklisted ? { borderColor: "#dc2626" } : {}} />
          </FormRow>

          <FormRow label="User Name" required>
            <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} />
          </FormRow>

          <FormRow label="Company Name" required>
            <select value={company} onChange={(e) => setCompany(e.target.value)}>
              <option value="">Select company</option>
              <option value="lloyds-operations">lloyds-operations</option>
              <option value="lloyds-project">lloyds-project</option>
            </select>
          </FormRow>

          <FormRow label="Contractor Name" required>
            <select
              value={contractorName}
              onChange={(e) => setContractorName(e.target.value)}
              disabled={contractorOptions.length === 0}
            >
              <option value="">
                {contractorOptions.length === 0
                  ? "No contractors found. Add from Contractors section."
                  : "Select contractor"}
              </option>
              {contractorOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </FormRow>

          <FormRow label="Start date" required>
            <input className="date-compact" type="text" value={toIndianDate(startDate)} readOnly />
          </FormRow>

          <FormRow label="End date" required>
            <input
              className="date-compact"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              onKeyDown={preventManualDateEntry}
              onPaste={(e) => e.preventDefault()}
            />
          </FormRow>

          <FormRow label="Blood Group" required>
            <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
              <option value="">Select blood group</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </FormRow>

          <FormRow label="Age" required>
            <input
              type="number"
              min="1"
              max="62"
              value={age}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  setAge("");
                  return;
                }
                const numeric = Number(value);
                if (!Number.isNaN(numeric)) {
                  setAge(String(Math.min(62, Math.max(1, numeric))));
                }
              }}
            />
          </FormRow>

          <FormRow label="Designation" required>
            <div style={{ position: "relative", width: "100%" }}>
              <input
                type="text"
                value={designation}
                onChange={(e) => {
                  setDesignation(e.target.value);
                  setShowDesignationDropdown(true);
                }}
                onFocus={() => setShowDesignationDropdown(true)}
                onBlur={() => setTimeout(() => setShowDesignationDropdown(false), 120)}
                placeholder="Type or select designation"
                autoComplete="off"
              />
              {showDesignationDropdown && filteredDesignations.length > 0 && (
                <div
                  onMouseDown={(e) => e.preventDefault()}
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    maxHeight: "180px",
                    overflowY: "auto",
                    background: "#fff",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    marginTop: "6px",
                    zIndex: 20,
                    boxShadow: "0 10px 24px rgba(0,0,0,0.08)"
                  }}
                >
                  {filteredDesignations.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setDesignation(name);
                        setShowDesignationDropdown(false);
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 12px",
                        border: "none",
                        borderBottom: "1px solid #f3f4f6",
                        background: "white",
                        cursor: "pointer",
                        fontSize: "14px"
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </FormRow>

          <FormRow label="Emergency Phone Number" required>
            <input
              type="tel"
              maxLength={10}
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="10-digit number"
            />
          </FormRow>

          <FormRow label="Aadhar Number" required>
            <input
              type="text"
              maxLength={12}
              value={aadharNumber}
              onChange={(e) => setAadharNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="12-digit Aadhar"
            />
          </FormRow>

          <FormRow label="Rent (Optional)">
            <input
              type="number"
              min="0"
              step="0.01"
              value={rent}
              onChange={(e) => setRent(e.target.value)}
              placeholder="Enter rent amount"
            />
          </FormRow>

          <FormRow label="Remarks">
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </FormRow>
        </div>

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
