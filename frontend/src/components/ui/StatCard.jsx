import Card from "./Card";

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "from-blue-600 to-cyan-500",
}) {
  return (
    <Card className="group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">
            {title}
          </p>

          <h2 className="mt-3 text-4xl font-bold text-white">
            {value}
          </h2>

          <p className="mt-3 text-sm text-slate-500">
            {subtitle}
          </p>
        </div>

        <div
          className={`
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-2xl
            bg-gradient-to-r
            ${color}
            shadow-xl
            transition-transform
            duration-300
            group-hover:scale-110
          `}
        >
          {Icon && (
            <Icon
              size={28}
              className="text-white"
            />
          )}
        </div>
      </div>
    </Card>
  );
}