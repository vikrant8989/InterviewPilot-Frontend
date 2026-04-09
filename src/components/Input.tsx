import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', ...props }, ref) => {
    const baseClasses = 'w-full px-3 py-2 rounded-lg border bg-bg-secondary text-text-primary placeholder-text-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent';
    
    const stateClasses = error
      ? 'border-status-error focus:ring-status-error'
      : 'border-border-primary focus:ring-border-accent';

    const classes = [
      baseClasses,
      stateClasses,
      leftIcon ? 'pl-10' : '',
      rightIcon ? 'pr-10' : '',
      className
    ].filter(Boolean).join(' ');

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="text-text-muted">{leftIcon}</div>
            </div>
          )}
          <input
            ref={ref}
            className={classes}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="text-text-muted">{rightIcon}</div>
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-status-error">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-text-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
