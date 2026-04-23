export function Label({ className = "", children }) {
  return (
    <label
      className={className}
      style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}
    >
      {children}
    </label>
  );
}
