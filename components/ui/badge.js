export function Badge({ className = "", variant = "default", children }) {
  const style = variant === "secondary"
    ? { background: "#e2e8f0", color: "#0f172a" }
    : { background: "#0f172a", color: "white" };

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 8px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 600,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
