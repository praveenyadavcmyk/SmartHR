export default function Avatar({
  name = "Admin",
  size = "h-12 w-12",
}) {
  return (
    <div
      className={`
        ${size}
        rounded-full
        bg-gradient-to-r
        from-blue-600
        to-cyan-500
        flex
        items-center
        justify-center
        font-bold
        text-white
        shadow-lg
      `}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}