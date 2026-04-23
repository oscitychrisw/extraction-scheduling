const base = {
  default: {
    background: "#0f172a",
    color: "white",
    border: "1px solid #0f172a",
  },
  secondary: {
    background: "#e2e8f0",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
  },
  outline: {
    background: "white",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
  },
  destructive: {
    background: "#dc2626",
    color: "white",
    border: "1px solid #dc2626",
  },
};

export function Button({
  className = "",
  variant = "default",
  size = "md",
  disabled = false,
  style = {},
  children,
  ...props
}) {
  const sizeStyle = size === "sm"
    ? { padding: "6px 10px", fontSize: "12px" }
    : { padding: "10px 14px", fontSize: "14px" };

  return (
    <button
      disabled={disabled}
      style={{
        borderRadius: "16px",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        opacity: disabled ? 0.6 : 1,
        ...base[variant],
        ...sizeStyle,
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}
