"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { transitions, easing } from '@/styles/animations';

export interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  once?: boolean;
}

const getInitialPosition = (direction: ScrollRevealProps['direction'], distance: number) => {
  switch (direction) {
    case 'up':
      return { opacity: 0, y: distance };
    case 'down':
      return { opacity: 0, y: -distance };
    case 'left':
      return { opacity: 0, x: distance };
    case 'right':
      return { opacity: 0, x: -distance };
    case 'none':
      return { opacity: 0 };
    default:
      return { opacity: 0, y: distance };
  }
};

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  distance = 30,
  once = true,
}) => {
  const initial = getInitialPosition(direction, distance);

  return (
    <motion.div
      initial={initial}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: '-50px' }}
      transition={{
        duration: transitions.smooth.duration / 1000,
        ease: easing.easeOut,
        delay: delay / 1000,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Stagger children animation
export const StaggerContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}> = ({ children, className = '', staggerDelay = 100 }) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay / 1000,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Stagger item for use with StaggerContainer
export const StaggerItem: React.FC<{
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
}> = ({ children, className = '', direction = 'up', distance = 20 }) => {
  const initial = getInitialPosition(direction, distance);

  return (
    <motion.div
      variants={{
        hidden: initial,
        visible: { opacity: 1, x: 0, y: 0 },
      }}
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

export default ScrollReveal;
