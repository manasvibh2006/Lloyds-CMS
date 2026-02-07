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
      const response = await api.get("/allocations");
      
      // Group allocations by contractor and company
      const contractorMap = {};
      let totalEmployees = 0;
      
      response.data.forEach(allocation => {
        totalEmployees += 1;
        const key = `${allocation.contractorName}-${allocation.company}`;
        if (!contractorMap[key]) {
          contractorMap[key] = {
            contractor_name: allocation.contractorName,
            company: allocation.company,
            employeeCount: 0
          };
        }
        contractorMap[key].employeeCount += 1;
      });
      
      const contractorsList = Object.values(contractorMap);
      setContractors(contractorsList);
      
      // Update dashboard data with total employees
      setDashboardData(prev => ({
        ...prev,
        activeEmployees: totalEmployees
      }));
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
              onClick={() => onNavigate("blocks")}
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
              {contractors.map((contractor, index) => (
                <tr key={index}>
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
