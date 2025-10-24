import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type, 
  isVisible, 
  onClose, 
  duration = 2500 
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success': return 'bg-accent';
      case 'error': return 'bg-alert';
      case 'info': return 'bg-primary';
      default: return 'bg-primary';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success': return 'text-text-primary';
      case 'error': return 'text-text-tertiary';
      case 'info': return 'text-text-tertiary';
      default: return 'text-text-tertiary';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ 
            opacity: 0, 
            y: 1, 
            scale: 0.95,
            transition: {
              duration: 0.25, 
              ease: "easeInOut" 
            }
          }}
          transition={{ 
            duration: 0.3, 
            ease: "easeOut"
          }}
          className="fixed top-4 right-4 z-50 max-w-sm"
        >
          <div className={`${getBgColor()} ${getTextColor()} px-4 py-3 rounded-card shadow-lg flex items-center gap-3 backdrop-blur-sm`}>
            <span className="text-lg">{getIcon()}</span>
            <span className="font-sans text-body flex-1">{message}</span>
            <button
              onClick={onClose}
              className="text-text-primary/75 hover:text-text-primary/50 text-xl leading-none transition-colors"
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Simple toast hook for easy usage
export const useToast = () => {
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast(null);
  };

  const ToastComponent = toast ? (
    <Toast
      message={toast.message}
      type={toast.type}
      isVisible={toast.isVisible}
      onClose={hideToast}
    />
  ) : null;

  return { showToast, hideToast, ToastComponent };
};
