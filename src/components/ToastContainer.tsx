"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast, { ToastProps, ToastType } from './Toast';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastContextValue {
  show: (message: string, type?: ToastType, duration?: number) => string;
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  warning: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
  remove: (id: string) => void;
  clear: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastWithId extends ToastProps {
  id: string;
}

interface ToastProviderProps {
  children: ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'top-right',
  maxToasts = 5,
}) => {
  const [toasts, setToasts] = useState<ToastWithId[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 5000): string => {
      const id = Math.random().toString(36).substring(2, 9);

      const newToast: ToastWithId = {
        id,
        message,
        type,
        duration,
        onClose: remove,
      };

      setToasts((prev) => {
        const updated = [newToast, ...prev];
        return updated.slice(0, maxToasts);
      });

      return id;
    },
    [remove, maxToasts]
  );

  const success = useCallback(
    (message: string, duration?: number) => show(message, 'success', duration),
    [show]
  );

  const error = useCallback(
    (message: string, duration?: number) => show(message, 'error', duration),
    [show]
  );

  const warning = useCallback(
    (message: string, duration?: number) => show(message, 'warning', duration),
    [show]
  );

  const info = useCallback(
    (message: string, duration?: number) => show(message, 'info', duration),
    [show]
  );

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  const value: ToastContextValue = {
    show,
    success,
    error,
    warning,
    info,
    remove,
    clear,
  };

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast Container */}
      <div className={`fixed z-50 ${positionClasses[position]} flex flex-col gap-2 pointer-events-none`}>
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Toast {...toast} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
