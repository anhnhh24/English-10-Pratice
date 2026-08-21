import React from 'react';

interface StatCardProps {
  icon: React.ElementType;
  iconColor?: string;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  progressPercent?: number;
  progressColor?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  iconColor = 'text-[#5A5A40]',
  title,
  value,
  subtitle,
  trend,
  progressPercent,
  progressColor = 'bg-[#5A5A40]',
  className = '',
}) => {
  return (
    <div
      className={`bg-white p-5 rounded-[2rem] border border-[#EAE7E0] shadow-xs space-y-2 hover:shadow-sm transition ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-[#8A8A70] text-xs font-bold uppercase tracking-wider">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          <span>{title}</span>
        </div>
        {trend && (
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {trend}
          </span>
        )}
      </div>

      <div className="text-2xl sm:text-3xl font-extrabold text-[#3D3D2D]">{value}</div>

      {progressPercent !== undefined && (
        <div className="w-full bg-[#FAF9F6] h-2 rounded-full overflow-hidden border border-[#EAE7E0]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      )}

      {subtitle && <p className="text-[11px] text-[#8A8A70] font-medium">{subtitle}</p>}
    </div>
  );
};
