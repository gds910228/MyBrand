"use client";

import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from './ThemeProvider';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 确保组件在客户端渲染后才显示
  useEffect(() => {
    setMounted(true);
  }, []);

  // 切换主题
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // 避免在服务器端渲染期间显示错误的主题图标
  if (!mounted) {
    return <div className="w-8 h-8"></div>;
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-neutral-light dark:bg-dark-neutral-light text-neutral-dark dark:text-dark-neutral-dark hover:bg-neutral-muted/20 dark:hover:bg-dark-neutral-muted/20 transition-colors"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <FontAwesomeIcon 
        icon={theme === 'light' ? faMoon : faSun} 
        className="h-5 w-5" 
      />
    </button>
  );
};

export default ThemeToggle; 