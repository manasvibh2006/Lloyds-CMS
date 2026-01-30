function DashboardCard({ title, subtitle, onClick }) {
  return (
    <div className="dashboard-card" onClick={onClick}>
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
  );
}

export default DashboardCard;
