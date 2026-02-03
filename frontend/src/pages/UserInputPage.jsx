import { useState } from "react";
import FormRow from "../components/FormRow";
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

  const handleSubmit = async () => {
    if (!bookingData?.bedId) {
      alert("Booking data missing. Please select a bed again.");
      return;
    }

    if (!userId || !userName || !company || !startDate || !endDate) {
      alert("Please fill all required fields");
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
  alert("End date must be after start date");
  return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/allocations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId,
          userName,
          company,
          contractorName,
          bedId: bookingData.bedId, // 🔥 CRITICAL
          startDate,
          endDate,
          remarks
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Allocation failed");
        setLoading(false);
        return;
      }

      alert("Allocation successful");
      onSuccess(); // move to next step / dashboard

    } catch (err) {
      console.error("Allocation error:", err);
      alert("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-card">
      <div className="user-card-header">
        User Details
      </div>

      <div className="user-card-body">
        <FormRow label="User ID" required>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </FormRow>

        <FormRow label="User Name" required>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </FormRow>

        <FormRow label="Company Name" required>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </FormRow>

        <FormRow label="Contractor Name">
          <input
            type="text"
            value={contractorName}
            onChange={(e) => setContractorName(e.target.value)}
          />
        </FormRow>

        <FormRow label="start date" required>
          <input
           type="date"
           value={startDate}
           onChange={(e) =>setStartDate(e.target.value)}
          />
          </FormRow>

          <FormRow label="End date" required>
            <input
            type="date"
            value={endDate}
            onChange={(e) =>setEndDate(e.target.value)}
          />
          </FormRow>


        <FormRow label="Remarks">
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </FormRow>

        <div className="user-button-group">
          <button
            className="btn-submit"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Saving..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserInputPage;
