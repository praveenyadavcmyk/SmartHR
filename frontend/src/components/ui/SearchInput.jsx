import { MdSearch } from "react-icons/md";

export default function SearchInput({
  placeholder = "Search...",
  value,
  onChange,
  className = "",
}) {
  return (
    <div
      className={`
        relative
        w-full
        ${className}
      `}
    >
      <MdSearch
        size={20}
        className="
          absolute
          left-4
          top-1/2
          -translate-y-1/2
          text-slate-400
        "
      />

      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="
          w-full
          rounded-2xl
          border
          border-white/10
          bg-white/5
          py-3
          pl-12
          pr-4
          text-sm
          text-white
          outline-none
          backdrop-blur-xl
          transition-all
          duration-300

          placeholder:text-slate-500

          focus:border-blue-500
          focus:ring-4
          focus:ring-blue-500/10
        "
      />
    </div>
  );
}