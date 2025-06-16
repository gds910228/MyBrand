"use client";

import React from 'react';
import Container from './Container';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  containerSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  containerPadding?: 'none' | 'sm' | 'md' | 'lg';
  containerClassName?: string;
  bgColor?: string;
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
}

const Section: React.FC<SectionProps> = ({
  children,
  className = '',
  id,
  containerSize = 'lg',
  containerPadding = 'md',
  containerClassName = '',
  bgColor = '',
  spacing = 'lg',
}) => {
  // Spacing classes for different sizes
  const spacingClasses = {
    sm: 'py-6 sm:py-8 md:py-10',
    md: 'py-8 sm:py-12 md:py-14',
    lg: 'py-10 sm:py-14 md:py-16 lg:py-20',
    xl: 'py-12 sm:py-16 md:py-20 lg:py-24',
  };

  return (
    <section id={id} className={`${spacingClasses[spacing]} ${bgColor} ${className}`}>
      <Container size={containerSize} padding={containerPadding} className={containerClassName}>
        {children}
      </Container>
    </section>
  );
};

export default Section; 