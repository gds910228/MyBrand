"use client";

import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Container: React.FC<ContainerProps> = ({
  children,
  className = '',
  as: Component = 'div',
  size = 'lg',
  padding = 'md',
}) => {
  // Padding classes
  const paddingClasses = {
    none: '',
    sm: 'px-3 sm:px-4',
    md: 'px-4 sm:px-6',
    lg: 'px-4 sm:px-6 md:px-8',
  };
  
  // Size classes
  const sizeClasses = {
    xs: 'max-w-xl',     // 576px
    sm: 'max-w-3xl',    // 768px
    md: 'max-w-4xl',    // 896px
    lg: 'max-w-6xl',    // 1152px
    xl: 'max-w-7xl',    // 1280px
    full: '',           // No max-width
  };
  
  // Combine all classes
  const classes = `mx-auto w-full ${paddingClasses[padding]} ${sizeClasses[size]} ${className}`;
  
  return <Component className={classes}>{children}</Component>;
};

export default Container; 