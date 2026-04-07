import { type ElementType } from "react";
import { cn } from "../../utils/cn";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: IconType;
  variant?: "primary" | "success" | "warning" | "danger";
}

type IconType = ElementType;

const StatsCard = ({ label, value, icon: Icon, variant = "primary" }: StatsCardProps) => {
  const variantStyles = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div className={cn(
          "p-3 rounded-xl transition-transform duration-300 group-hover:scale-110",
          variantStyles[variant]
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="ContentSMedium text-gray-400 uppercase tracking-wider">{label}</p>
        <h3 className="DisplayMBold text-gray-900 tabular-nums">{value}</h3>
      </div>
    </div>
  );
};

export default StatsCard;
