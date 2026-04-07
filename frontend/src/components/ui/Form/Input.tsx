import React, { forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full space-y-2 group">
        {label && (
          <label className="ContentMBold text-gray-700 block transition-colors group-focus-within:text-primary mb-1">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-4 text-gray-400 group-focus-within:text-primary transition-colors">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "w-full bg-gray-50 border-2 border-transparent rounded-2xl py-3.5 px-4 text-gray-900 ContentMRegular transition-all outline-none",
              "placeholder:text-gray-400",
              "hover:bg-gray-100",
              "focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10",
              leftIcon && "pl-12",
              rightIcon && "pr-12",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500/10 bg-red-50/50",
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-500 font-medium animate-in slide-in-from-top-1 duration-200 mt-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
