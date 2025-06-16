"use client";

import React from 'react';
import Link from 'next/link';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: () => void;
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
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors rounded-lg focus:outline-none";
  
  const variantStyles = {
    solid: "bg-primary hover:bg-primary-dark text-white dark:bg-dark-primary dark:hover:bg-dark-primary-dark",
    outline: "border-2 border-primary text-primary hover:bg-primary hover:text-white dark:border-dark-primary dark:text-dark-primary dark:hover:bg-dark-primary dark:hover:text-dark-neutral-light",
    ghost: "text-primary hover:bg-primary-light hover:text-primary-dark dark:text-dark-primary dark:hover:bg-dark-primary-light dark:hover:text-dark-primary-dark"
  };
  
  const sizeStyles = {
    sm: "text-sm py-1 px-3",
    md: "text-base py-2 px-4",
    lg: "text-lg py-3 px-6"
  };
  
  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";
  
  const buttonStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`;
  
  if (href) {
    return (
      <Link href={href} className={buttonStyles}>
        {children}
      </Link>
    );
  }
  
  return (
    <button
      type={type}
      className={buttonStyles}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button; 