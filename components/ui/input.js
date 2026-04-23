export function Input({ className = "", style = {}, ...props }) {
  return (
    <input
      className={className}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: "12px",
        border: "1px solid #cbd5e1",
        background: "white",
        ...style,
      }}
      {...props}
    />
  );
}
