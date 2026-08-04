import { MdInbox } from "react-icons/md";

export default function EmptyState({
  title = "No Data",
  subtitle = "Nothing to display.",
}) {
  return (
    <div
      className="
        flex
        flex-col
        items-center
        justify-center
        rounded-3xl
        border
        border-dashed
        border-white/10
        bg-white/5
        py-20
        text-center
      "
    >
      <div
        className="
          flex
          h-20
          w-20
          items-center
          justify-center
          rounded-full
          bg-blue-500/10
        "
      >
        <MdInbox
          size={42}
          className="text-blue-400"
        />
      </div>

      <h2 className="mt-6 text-2xl font-bold text-white">
        {title}
      </h2>

      <p className="mt-2 max-w-md text-slate-400">
        {subtitle}
      </p>
    </div>
  );
}