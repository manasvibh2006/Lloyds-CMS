import DashboardCard from "../components/DashboardCard";
import "../styles/dashboard.css";

function DashboardPage({ onNavigate }) {
  return (
    <div className="dashboard-container">
      <DashboardCard
        title="Booking"
        subtitle="Book bed for labourer"
        onClick={() => onNavigate("booking")}
      />

      <DashboardCard
        title="Buildings"
        subtitle="View camp buildings"
        onClick={() => onNavigate("block")}
      />

      <DashboardCard
        title="Rooms"
        subtitle="Manage rooms"
        onClick={() => onNavigate("room")}
      />

      <DashboardCard
        title="Allocations"
        subtitle="Labourer allocations"
        onClick={() => onNavigate("allocation")}
      />
    </div>
  );
}

export default DashboardPage;
