"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: () => void;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'solid',
  size = 'md',
  className = '',
  href,
  type = 'button',
  disabled = false,
  onClick,
  fullWidth = false,
  icon,
  iconPosition = 'left',
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-dark-bg-primary relative overflow-hidden group";

  const variantStyles = {
    solid: "bg-primary text-white dark:bg-dark-primary shadow-md hover:shadow-lg",
    outline: "border-2 border-primary text-primary dark:border-dark-primary dark:text-dark-primary hover:bg-primary/5 dark:hover:bg-dark-primary/10",
    ghost: "text-primary hover:bg-primary/10 dark:text-dark-primary dark:hover:bg-dark-primary/10"
  };

  const sizeStyles = {
    sm: "text-sm py-1.5 px-3 gap-1.5",
    md: "text-base py-2 px-4 gap-2",
    lg: "text-lg py-3 px-6 gap-2.5"
  };

  const disabledStyles = disabled
    ? "opacity-50 cursor-not-allowed"
    : "cursor-pointer";

  const widthStyle = fullWidth ? "w-full" : "";

  const buttonStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${widthStyle} ${className}`.trim();

  // Ripple effect overlay
  const ripple = (
    <motion.span
      className="absolute inset-0 bg-current opacity-0 group-hover:opacity-10 transition-opacity"
      initial={{ scale: 0 }}
      whileHover={{ scale: 1 }}
      transition={{ duration: 0.3 }}
    />
  );

  const content = (
    <>
      {ripple}
      {icon && iconPosition === 'left' && (
        <span className="flex-shrink-0">{icon}</span>
      )}
      <span className="relative z-10">{children}</span>
      {icon && iconPosition === 'right' && (
        <span className="flex-shrink-0">{icon}</span>
      )}
    </>
  );

  const motionProps = !disabled ? {
    whileHover: { y: -1 },
    whileTap: { scale: 0.97 },
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 17
    }
  } : {};

  const sharedProps = {
    className: buttonStyles,
    ...motionProps
  };

  if (href) {
    return (
      <Link href={href} {...sharedProps}>
        {content}
      </Link>
    );
  }

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      {...sharedProps}
    >
      {content}
    </motion.button>
  );
};

export default Button; 