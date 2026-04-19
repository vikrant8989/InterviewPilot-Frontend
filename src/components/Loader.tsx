import React from 'react';

export interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const Loader = React.forwardRef<HTMLDivElement, LoaderProps>(
  ({ size = 'md', text, fullScreen = false, className = '', ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-12 h-12',
      lg: 'w-16 h-16',
    };

    const borderClasses = {
      sm: 'border-2',
      md: 'border-[3px]',
      lg: 'border-4',
    };

    const containerClasses = fullScreen
      ? 'fixed inset-0 flex items-center justify-center bg-bg-primary/80 backdrop-blur-sm z-50'
      : 'flex flex-col items-center justify-center';

    return (
      <div
        ref={ref}
        className={`${containerClasses} ${className}`}
        {...props}
      >
        <div className="relative">
          <div className={`${sizeClasses[size]} ${borderClasses[size]} border-primary-500/20 rounded-full`} />
          <div 
            className={`${sizeClasses[size]} ${borderClasses[size]} border-primary-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0`}
          />
        </div>
        {text && (
          <p className="mt-6 text-sm text-text-secondary animate-pulse font-medium">
            {text}
          </p>
        )}
      </div>
    );
  }
);

Loader.displayName = 'Loader';

export default Loader;
