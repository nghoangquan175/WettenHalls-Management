import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../../utils/cn';

export type ActionButtonVariant = 'default' | 'danger' | 'warning' | 'success';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: ActionButtonVariant;
  tooltip?: string;
  isLoading?: boolean;
}

const VARIANT_STYLES: Record<ActionButtonVariant, string> = {
  default: 'text-gray-500 hover:text-gray-900 hover:bg-gray-100',
  danger: 'text-red-500 hover:text-red-600 hover:bg-red-100/50',
  warning: 'text-amber-500 hover:text-amber-600 hover:bg-amber-100/50',
  success: 'text-green-500 hover:text-green-600 hover:bg-green-100/50',
};

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  variant = 'default',
  tooltip,
  className,
  disabled,
  isLoading,
  ...props
}) => {
  return (
    <button
      type="button"
      className={cn(
        'relative p-2 rounded-lg transition-colors group/btn',
        VARIANT_STYLES[variant],
        (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : icon}

      
      {tooltip && (
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-medium rounded opacity-0 group-hover/btn:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
          {tooltip}
          {/* Tooltip arrow */}
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></span>
        </span>
      )}
    </button>
  );
};
