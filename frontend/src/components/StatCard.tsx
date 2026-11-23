
import type { LucideIcon } from "lucide-react";
import { TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  trend?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  color,
  trend,
}: StatCardProps) {

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </h2>
        </div>

        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}18`, color }}
        >
          <Icon size={23} />
        </div>

      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1 text-xs font-medium text-emerald-600">
          <TrendingUp size={14} />
          <span>{trend}</span>
        </div>
      )}

    </div>
  );
}
