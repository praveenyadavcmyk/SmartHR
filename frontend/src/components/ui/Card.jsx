export default function Card({
  children,
  className = "",
  hover = true,
  padding = "p-6",
}) {
  return (
    <div
      className={`
        relative
        overflow-hidden
        rounded-3xl
        border
        border-white/10
        bg-white/5
        backdrop-blur-xl
        shadow-xl
        transition-all
        duration-300
        ${
          hover
            ? "hover:-translate-y-1 hover:shadow-blue-500/10 hover:border-blue-500/20"
            : ""
        }
        ${padding}
        ${className}
      `}
    >
      {/* Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 pointer-events-none" />

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}