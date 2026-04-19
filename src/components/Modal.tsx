import React from 'react';
import Loader from './Loader';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
  isLoading?: boolean;
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = "Confirm", 
    cancelText = "Cancel",
    variant = "default",
    isLoading = false
  }, ref) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div 
          className="fixed inset-0 bg-bg-primary/80 backdrop-blur-sm"
          onClick={!isLoading ? onClose : undefined}
        />
        <div
          ref={ref}
          className="relative bg-card-primary border border-card-border rounded-xl shadow-dark-lg p-6 max-w-md w-full mx-4 animate-slide-up"
        >
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            {title}
          </h3>
          <p className="text-sm text-text-secondary mb-6">
            {message}
          </p>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader size="sm" />
            </div>
          ) : (
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-text-primary border border-border-primary hover:bg-bg-tertiary transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  variant === 'danger'
                    ? 'bg-status-error text-white hover:bg-status-error/90'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                }`}
              >
                {confirmText}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';

export default Modal;
