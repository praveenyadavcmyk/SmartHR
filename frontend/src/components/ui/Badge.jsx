const colors = {
  success:
    "bg-emerald-500/15 text-emerald-400",

  warning:
    "bg-yellow-500/15 text-yellow-400",

  danger:
    "bg-red-500/15 text-red-400",

  info:
    "bg-blue-500/15 text-blue-400",
};

export default function Badge({
  children,
  color = "info",
}) {
  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        px-3
        py-1
        text-xs
        font-semibold
        ${colors[color]}
      `}
    >
      {children}
    </span>
  );
}