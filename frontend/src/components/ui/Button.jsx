const variants = {
  primary:
    "bg-blue-600 hover:bg-blue-500 text-white",

  secondary:
    "bg-slate-800 hover:bg-slate-700 text-white",

  danger:
    "bg-red-600 hover:bg-red-500 text-white",

  success:
    "bg-emerald-600 hover:bg-emerald-500 text-white",

  outline:
    "border border-slate-700 hover:border-blue-500 bg-transparent text-white",
};

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  return (
    <button
      {...props}
      className={`
        inline-flex
        items-center
        justify-center
        rounded-xl
        px-5
        py-3
        text-sm
        font-semibold
        transition-all
        duration-300
        hover:scale-[1.02]
        active:scale-95
        shadow-lg
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}