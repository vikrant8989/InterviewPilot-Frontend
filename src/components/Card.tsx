import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', children, className = '', ...props }, ref) => {
    const baseClasses = 'rounded-xl border transition-all duration-200';
    
    const variantClasses = {
      default: 'bg-card-primary border-card-border shadow-dark-md',
      interactive: 'bg-card-primary border-card-border shadow-dark-md hover:shadow-dark-lg cursor-pointer hover:border-border-accent',
      glass: 'glass-effect',
    };

    const paddingClasses = {
      none: '',
      sm: 'p-3',
      md: 'p-6',
      lg: 'p-8',
    };

    const classes = [
      baseClasses,
      variantClasses[variant],
      paddingClasses[padding],
      className
    ].filter(Boolean).join(' ');

    return (
      <div
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
