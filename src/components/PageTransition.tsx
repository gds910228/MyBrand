"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { transitions, easing } from '@/styles/animations';

export interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  type?: 'fade' | 'slideUp' | 'scale' | 'slideIn';
}

const variants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
};

const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = '',
  type = 'fade',
}) => {
  const variant = variants[type];

  return (
    <motion.div
      initial={variant.initial}
      animate={variant.animate}
      exit={variant.exit}
      transition={{
        duration: transitions.smooth.duration / 1000,
        ease: easing.easeOut,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
