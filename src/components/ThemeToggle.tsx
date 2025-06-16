"use client";

import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from './ThemeProvider';
import { usePathname } from 'next/navigation';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const locale = pathname.startsWith('/zh') ? 'zh' : 'en';

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

  const ariaLabel = theme === 'light' 
    ? (locale === 'zh' ? '深色模式' : 'Dark Mode') 
    : (locale === 'zh' ? '浅色模式' : 'Light Mode');

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-neutral-light dark:bg-dark-neutral-light text-neutral-dark dark:text-dark-neutral-dark hover:bg-neutral-muted/20 dark:hover:bg-dark-neutral-muted/20 transition-colors"
      aria-label={ariaLabel}
    >
      <FontAwesomeIcon 
        icon={theme === 'light' ? faMoon : faSun} 
        className="h-5 w-5" 
      />
    </button>
  );
};

export default ThemeToggle; 