"use client";

import React from 'react';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  subtitleClassName?: string;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  subtitle,
  centered = true,
  className = '',
  size = 'md',
  subtitleClassName = '',
}) => {
  // Title size classes
  const titleSizeClasses = {
    sm: 'text-2xl sm:text-3xl font-bold',
    md: 'text-2xl sm:text-3xl md:text-4xl font-bold',
    lg: 'text-3xl sm:text-4xl md:text-5xl font-bold',
  };

  // Margin bottom classes
  const marginClasses = {
    sm: 'mb-6 sm:mb-8',
    md: 'mb-8 sm:mb-10',
    lg: 'mb-10 sm:mb-12',
  };

  return (
    <div className={`${marginClasses[size]} ${centered ? 'text-center' : ''} ${className}`}>
      <h2 className="text-3xl md:text-4xl font-bold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-lg text-neutral-dark dark:text-dark-neutral-dark max-w-3xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionHeading; 