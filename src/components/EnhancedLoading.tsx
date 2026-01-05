"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface EnhancedLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

const EnhancedLoading: React.FC<EnhancedLoadingProps> = ({
  size = 'md',
  text,
  fullScreen = false,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const dotSize = {
    sm: 8,
    md: 12,
    lg: 16,
  };

  const containerClass = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-dark-bg-primary/80 backdrop-blur-sm z-50'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center gap-6">
        {/* Animated dots */}
        <div className={`flex items-center gap-3 ${sizeClasses[size]}`}>
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="rounded-full bg-gradient-to-r from-primary to-primary-dark dark:from-dark-primary dark:to-dark-primary-dark"
              style={{
                width: dotSize[size],
                height: dotSize[size],
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: index * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Optional text */}
        {text && (
          <motion.p
            className="text-neutral-dark dark:text-dark-neutral-dark text-sm font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {text}
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default EnhancedLoading;
