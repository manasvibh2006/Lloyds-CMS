import { useEffect, useState } from "react";
import api from "../services/api";
import FormRow from "../components/FormRow";
import "../styles/form.css";

function ContractorsPage() {
  const [contractorCode, setContractorCode] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  const fetchContractors = async () => {
    setLoading(true);
    try {
      const response = await api.get("/contractors");
      setRows(response.data || []);
    } catch (err) {
      console.error("Failed to fetch contractors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractors();
  }, []);

  const handleSubmit = async () => {
    if (!contractorCode || !name || !company || !phoneNumber || !email) {
      alert("Please fill all fields");
      return;
    }

    setSaving(true);
    try {
      await api.post("/contractors", {
        contractorCode,
        name,
        company,
        phoneNumber,
        email
      });
      alert("Contractor created successfully");
      setContractorCode("");
      setName("");
      setCompany("");
      setPhoneNumber("");
      setEmail("");
      fetchContractors();
    } catch (err) {
      console.error("Create contractor failed:", err);
      alert(err.response?.data?.error || "Failed to create contractor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          background: "#2C3E50",
          color: "white",
          padding: "10px",
          fontSize: "18px",
          borderRadius: "4px 4px 0 0"
        }}
      >
        Contractors
      </div>

      <div
        style={{
          background: "white",
          padding: "20px",
          border: "1px solid #ccc",
          borderTop: "none"
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0 18px" }}>
          <FormRow label="Contractor Code" required>
            <input type="text" value={contractorCode} onChange={(e) => setContractorCode(e.target.value)} />
          </FormRow>

          <FormRow label="Name" required>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </FormRow>

          <FormRow label="Company" required>
            <select value={company} onChange={(e) => setCompany(e.target.value)}>
              <option value="">select company</option>
              <option value="lloyds-project">lloyds-project</option>
              <option value="lloyds-operations">lloyds-operations</option>
            </select>
          </FormRow>

          <FormRow label="Phone Number" required>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
              maxLength={15}
            />
          </FormRow>

          <FormRow label="Email" required>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </FormRow>
        </div>

        <div className="button-group">
          <button className="btn-submit" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : "Save Contractor"}
          </button>
        </div>

        <div style={{ marginTop: "24px" }}>
          <h3 style={{ marginTop: 0 }}>Existing Contractors</h3>
          {loading ? (
            <p>Loading...</p>
          ) : rows.length === 0 ? (
            <p style={{ color: "#666" }}>No contractors found.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f4f6f8" }}>
                    <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Code</th>
                    <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Name</th>
                    <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Company</th>
                    <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Workers</th>
                    <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Phone</th>
                    <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>{row.contractor_code}</td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>{row.name}</td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>{row.company}</td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>{Number(row.worker_count || 0)}</td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>{row.phone_number}</td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>{row.email}</td>
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

export default ContractorsPage;
