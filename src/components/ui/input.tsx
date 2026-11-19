import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, disabled, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-primary-text"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-secondary-text">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full h-10 px-3.5 text-sm bg-surface text-primary-text border border-sb-border rounded-lg',
              'placeholder:text-zinc-400 transition-colors duration-150',
              'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent',
              'disabled:bg-zinc-50 disabled:text-zinc-400 disabled:cursor-not-allowed',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-error focus:border-error focus:ring-error',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center text-secondary-text">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-error">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-secondary-text">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
