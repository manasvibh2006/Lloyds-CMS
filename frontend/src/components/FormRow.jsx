function FormRow({ label, children, required }) {
  return (
    <div className="form-row">
      <label>
        {label} {required && <span style={{ color: "red" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

export default FormRow;
