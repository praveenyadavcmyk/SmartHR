import Badge from "./Badge";

export default function PageHeader({
  title,
  subtitle,
  badge,
  action,
}) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-5">
      <div>
        <h1 className="text-4xl font-bold text-white">
          {title}
        </h1>

        <p className="mt-2 text-slate-400">
          {subtitle}
        </p>

        {badge && (
          <div className="mt-4">
            <Badge color="info">
              {badge}
            </Badge>
          </div>
        )}
      </div>

      {action}
    </div>
  );
}