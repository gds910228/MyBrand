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
  centered = false,
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
      <h2 className={`${titleSizeClasses[size]} font-heading text-neutral-darker`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-3 sm:mt-4 text-base sm:text-lg text-neutral-dark max-w-3xl ${centered ? 'mx-auto' : ''} ${subtitleClassName}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionHeading; 