import { useState, useEffect } from "react";
import DashboardCard from "../components/DashboardCard";
import api from "../services/api";
import "../styles/dashboard.css";

function DashboardPage({ onNavigate }) {
  const [dashboardData, setDashboardData] = useState({
    companyName: "Lloyds",
    activeEmployees: 0,
    inactiveEmployees: 0
  });
  const [vacancies, setVacancies] = useState([]);
  const [error, setError] = useState(null);
  const [contractors, setContractors] = useState([]);
  const [contractorsLoading, setContractorsLoading] = useState(true);

  const fetchVacancies = async () => {
    try {
      const response = await api.get("/dashboard/vacancies");
      setVacancies(response.data || []);
    } catch (err) {
      console.error("Error fetching vacancies:", err);
    }
  };

  const fetchAllContractors = async () => {
    try {
      setContractorsLoading(true);
      const [contractorsResult, allocationsResult] = await Promise.allSettled([
        api.get("/contractors"),
        api.get("/allocations")
      ]);

      const contractorsRows =
        contractorsResult.status === "fulfilled" ? (contractorsResult.value.data || []) : [];
      const allocationRows =
        allocationsResult.status === "fulfilled" ? (allocationsResult.value.data || []) : [];

      // Start with master contractors (visible even with 0 workers)
      const contractorMap = new Map();
      for (const item of contractorsRows) {
        const name = (item.name || "").trim();
        if (!name) continue;
        const company = (item.company || "N/A").trim() || "N/A";
        const key = `${name.toLowerCase()}|${company.toLowerCase()}`;
        contractorMap.set(key, {
          id: item.id ?? key,
          contractor_name: name,
          company,
          employeeCount: 0,
          workerIds: new Set()
        });
      }

      // Merge allocation contractors (legacy/new allocation-only names)
      for (const row of allocationRows) {
        const rawName = (row.contractorName || "").trim();
        if (!rawName || rawName.toUpperCase() === "N/A") continue;
        const rawCompany = (row.company || "").trim();
        const company = rawCompany || "N/A";
        const key = `${rawName.toLowerCase()}|${company.toLowerCase()}`;

        if (!contractorMap.has(key)) {
          contractorMap.set(key, {
            id: key,
            contractor_name: rawName,
            company,
            employeeCount: 0,
            workerIds: new Set()
          });
        }

        // Count unique active workers, not allocation rows.
        const status = (row.statusDisplay || row.status || "").toUpperCase();
        if (status === "BOOKED" && row.userId) {
          contractorMap.get(key).workerIds.add(String(row.userId));
        }
      }

      const contractorsList = Array.from(contractorMap.values())
        .map((item) => ({
          id: item.id,
          contractor_name: item.contractor_name,
          company: item.company,
          employeeCount: item.workerIds.size
        }))
        .sort((a, b) => b.employeeCount - a.employeeCount);

      setContractors(contractorsList);

      // Keep total allocations card behavior.
      setDashboardData(prev => ({
        ...prev,
        activeEmployees: allocationRows.length
      }));

      if (contractorsResult.status === "rejected") {
        console.error("Contractors API failed:", contractorsResult.reason);
      }
      if (allocationsResult.status === "rejected") {
        console.error("Allocations API failed:", allocationsResult.reason);
      }
    } catch (err) {
      console.error("Error fetching contractors:", err);
      setError("Failed to load contractors data");
    } finally {
      setContractorsLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      await Promise.all([fetchAllContractors(), fetchVacancies()]);
      setError(null);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="dashboard-container">
      {error && <div className="error-message">{error}</div>}

      {/* Dashboard Summary Section */}
      <div className="dashboard-summary">
        {/* Left Column - Company, Allocations and Navigation Cards */}
        <div className="left-column">
          <div className="top-cards">
            <div className="summary-card company-card">
              <h3>Company Name</h3>
              <p>{dashboardData.companyName}</p>
            </div>
            <div className="summary-card active-card">
              <h3>Total Allocations</h3>
              <p className="count">{dashboardData.activeEmployees}</p>
            </div>
          </div>

          {/* Navigation Cards in 2x2 Grid */}
          <div className="dashboard-cards">
            <DashboardCard
              title="Booking"
              subtitle="Book bed for employees"
              onClick={() => onNavigate("booking")}
            />

            <DashboardCard
              title="Allocations"
              subtitle="Employee allocations"
              onClick={() => onNavigate("allocation")}
            />

            <DashboardCard
              title="Camps"
              subtitle="Manage buildings & rooms"
              onClick={() => onNavigate("camps")}
            />

            <DashboardCard
              title="Reports"
              subtitle="Camp management reports"
              onClick={() => onNavigate("reports")}
            />
          </div>
        </div>

        {/* Right Column - Vacancies Card */}
        <div className="summary-card vacancy-card">
          <h3>Vacancies</h3>
          <div className="vacancy-content">
            {vacancies.length === 0 ? (
              <p className="count">Loading...</p>
            ) : (
              vacancies.map((building, index) => (
                <div key={index} className="building-vacancy">
                  <div className="building-name">{building.building_name}</div>
                  <div className="vacancy-stats">
                    <span className="total-beds">Total: {building.total_beds || 0}</span>
                    <span className="vacant-beds">Vacant: {building.vacant_beds || 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Contractors Table Section */}
      <div className="contractors-section">
        <h2>Contractor Details</h2>
        {contractorsLoading ? (
          <p>Loading contractors...</p>
        ) : contractors.length === 0 ? (
          <p>No contractors found</p>
        ) : (
          <table className="contractors-table">
            <thead>
              <tr>
                <th>Contractor Name</th>
                <th>Company Name</th>
                <th>Employees Count</th>
              </tr>
            </thead>
            <tbody>
              {contractors.map((contractor) => (
                <tr key={contractor.id ?? `${contractor.contractor_name}-${contractor.company}`}>
                  <td>{contractor.contractor_name}</td>
                  <td>{contractor.company}</td>
                  <td>{contractor.employeeCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}

export default DashboardPage;
