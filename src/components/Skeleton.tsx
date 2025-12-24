"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}) => {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const baseClasses = 'bg-neutral-200 dark:bg-dark-neutral-200 shimmer';

  const style: React.CSSProperties = {
    width: width !== undefined ? width : undefined,
    height: height !== undefined ? height : undefined,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`.trim()}
      style={style}
      aria-hidden="true"
    />
  );
};

// Card Skeleton
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`glass-surface rounded-xl shadow-lg p-6 ${className}`}>
      {/* Image */}
      <Skeleton variant="rounded" height="192px" className="mb-4" />

      {/* Tags */}
      <div className="flex gap-2 mb-3">
        <Skeleton variant="text" width="60px" height="24px" />
        <Skeleton variant="text" width="80px" height="24px" />
      </div>

      {/* Title */}
      <Skeleton variant="text" height="28px" className="mb-2" />
      <Skeleton variant="text" width="80%" height="28px" className="mb-4" />

      {/* Excerpt */}
      <Skeleton variant="text" height="16px" className="mb-2" />
      <Skeleton variant="text" height="16px" className="mb-2" />
      <Skeleton variant="text" width="60%" height="16px" className="mb-4" />

      {/* Footer */}
      <div className="flex justify-between items-center">
        <Skeleton variant="text" width="100px" height="16px" />
        <Skeleton variant="text" width="80px" height="20px" />
      </div>
    </div>
  );
};

// Blog Card Skeleton
export const BlogCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <CardSkeleton className={className} />;
};

// Project Card Skeleton
export const ProjectCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <CardSkeleton className={className} />;
};

// Text Skeleton (multiple lines)
export const TextSkeleton: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height="16px"
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  );
};

// Hero Section Skeleton
export const HeroSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-neutral-light dark:bg-dark-bg-primary ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-28 lg:py-36">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Text content */}
          <div className="text-center lg:text-left">
            <Skeleton variant="text" height="60px" className="mb-4" />
            <Skeleton variant="text" width="70%" height="60px" className="mb-6" />

            <TextSkeleton lines={3} className="mb-8 max-w-2xl mx-auto lg:mx-0" />

            <div className="flex gap-4 justify-center lg:justify-start">
              <Skeleton variant="rounded" width="120px" height="48px" />
              <Skeleton variant="rounded" width="120px" height="48px" />
            </div>
          </div>

          {/* Image */}
          <Skeleton
            variant="rounded"
            height="384px"
            className="shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
};

// Form Skeleton
export const FormSkeleton: React.FC<{ fields?: number; className?: string }> = ({
  fields = 4,
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Skeleton variant="text" width="100px" height="16px" className="mb-2" />
          <Skeleton variant="rounded" height="48px" />
        </div>
      ))}
    </div>
  );
};

// Table Skeleton
export const TableSkeleton: React.FC<{
  rows?: number;
  cols?: number;
  className?: string;
}> = ({ rows = 5, cols = 4, className = '' }) => {
  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      <div className="flex gap-4 mb-4 pb-2 border-b border-neutral-200 dark:border-dark-neutral-200">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" width="120px" height="20px" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} variant="text" width="100px" height="16px" />
          ))}
        </div>
      ))}
    </div>
  );
};

// List Skeleton
export const ListSkeleton: React.FC<{
  items?: number;
  className?: string;
}> = ({ items = 5, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton variant="circular" width="48px" height="48px" />
          <div className="flex-grow">
            <Skeleton variant="text" width="60%" height="20px" className="mb-2" />
            <Skeleton variant="text" width="40%" height="16px" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
