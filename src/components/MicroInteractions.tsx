"use client";

import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';

// Tooltip component with smooth animations
export const Tooltip: React.FC<{
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}> = ({ children, content, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ duration: 0.2 }}
          className={`absolute z-50 px-3 py-1.5 text-xs font-medium text-white bg-neutral-darker dark:bg-dark-neutral-darker rounded-lg shadow-lg whitespace-nowrap ${positionClasses[position]}`}
          role="tooltip"
        >
          {content}
          <div className="absolute w-2 h-2 bg-neutral-darker dark:bg-dark-neutral-darker transform rotate-45" />
        </motion.div>
      )}
    </div>
  );
};

// Swipeable card component
export const SwipeableCard: React.FC<{
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
}> = ({ children, onSwipeLeft, onSwipeRight, className = '' }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 100 && onSwipeRight) {
      onSwipeRight();
    } else if (info.offset.x < -100 && onSwipeLeft) {
      onSwipeLeft();
    }
  };

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className={`cursor-grab active:cursor-grabbing ${className}`}
    >
      {children}
    </motion.div>
  );
};

// Pulse indicator for live updates
export const PulseIndicator: React.FC<{
  className?: string;
  color?: 'primary' | 'success' | 'warning' | 'error';
}> = ({ className = '', color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary dark:bg-dark-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
  };

  return (
    <div className={`relative w-3 h-3 ${className}`}>
      <motion.div
        className={`absolute inset-0 rounded-full ${colorClasses[color]}`}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [1, 0.5, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <div className={`absolute inset-0 rounded-full ${colorClasses[color]}`} />
    </div>
  );
};

// Progress bar with smooth animation
export const ProgressBar: React.FC<{
  progress: number;
  className?: string;
  showLabel?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
}> = ({ progress, className = '', showLabel = false, color = 'primary' }) => {
  const colorClasses = {
    primary: 'from-primary to-primary-dark dark:from-dark-primary dark:to-dark-primary-dark',
    success: 'from-success to-emerald-600',
    warning: 'from-warning to-amber-600',
    error: 'from-error to-red-600',
  };

  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between mb-2 text-sm">
          <span className="text-neutral-dark dark:text-dark-neutral-dark">Progress</span>
          <span className="font-medium text-neutral-darker dark:text-dark-neutral-darker">
            {Math.round(clampedProgress)}%
          </span>
        </div>
      )}
      <div className="h-2 w-full bg-neutral-light dark:bg-dark-neutral-light rounded-full overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${colorClasses[color]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

// Magnetic button effect
export const MagneticButton: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = '', onClick }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      transition={{ type: 'spring', stiffness: 150, damping: 15 }}
      className={className}
    >
      {children}
    </motion.button>
  );
};

// Text scramble effect for headings
export const ScrambleText: React.FC<{
  text: string;
  className?: string;
}> = ({ text, className = '' }) => {
  const [displayText, setDisplayText] = useState(text);

  React.useEffect(() => {
    const characters = '!<>-_\\/[]{}—=+*^?#________';
    let iteration = 0;
    let interval: NodeJS.Timeout;

    const animate = () => {
      setDisplayText(
        text
          .split('')
          .map((letter, index) => {
            if (index < iteration) {
              return text[index];
            }
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join('')
      );

      if (iteration >= text.length) {
        clearInterval(interval);
      }

      iteration += 1 / 3;
    };

    interval = setInterval(animate, 30);

    return () => clearInterval(interval);
  }, [text]);

  return <span className={className}>{displayText}</span>;
};

// Number counter animation
export const AnimatedCounter: React.FC<{
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}> = ({ value, duration = 2, className = '', suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0);

  React.useEffect(() => {
    let startTimestamp: number;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}
      {count}
      {suffix}
    </span>
  );
};
