function PageContainer({ title, children }) {
  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          background: "#2f78c4",
          color: "white",
          padding: "10px",
          fontSize: "18px",
          borderRadius: "4px 4px 0 0"
        }}
      >
        {title}
      </div>

      <div
        style={{
          background: "white",
          padding: "20px",
          border: "1px solid #ccc",
          borderTop: "none"
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default PageContainer;
