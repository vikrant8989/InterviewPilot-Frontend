import React from 'react';

export interface ChatBubbleProps {
  variant: 'user' | 'ai';
  message: string;
  timestamp?: string;
  isLoading?: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ variant, message, timestamp, isLoading = false }) => {
  const baseClasses = 'max-w-[80%] rounded-2xl px-4 py-3 animate-slide-up';
  
  const variantClasses = {
    user: 'bg-primary-500 text-white ml-auto',
    ai: 'bg-card-secondary text-text-primary border border-border-primary',
  };

  const classes = [baseClasses, variantClasses[variant]].filter(Boolean).join(' ');

  if (isLoading) {
    return (
      <div className={`${variantClasses.ai} opacity-60`}>
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <span className="text-sm text-text-muted">AI is thinking...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className={classes}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
      </div>
      {timestamp && (
        <p className={`text-xs text-text-muted ${variant === 'user' ? 'text-right' : ''}`}>
          {timestamp}
        </p>
      )}
    </div>
  );
};

export default ChatBubble;
