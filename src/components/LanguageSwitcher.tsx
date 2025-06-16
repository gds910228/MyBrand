"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

// 语言配置
const locales = ['en', 'zh'];
const localeNames = {
  en: 'English',
  zh: '中文',
};

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  
  // 获取当前语言
  const currentLocale = pathname.startsWith('/zh') ? 'zh' : 'en';

  const handleLocaleChange = (newLocale: string) => {
    // 如果是切换到英文且当前路径以/zh开头，则移除/zh
    if (newLocale === 'en' && pathname.startsWith('/zh')) {
      router.push(pathname.replace(/^\/zh/, ''));
    } 
    // 如果是切换到中文且当前路径不以/zh开头，则添加/zh
    else if (newLocale === 'zh' && !pathname.startsWith('/zh')) {
      router.push(`/zh${pathname}`);
    }
    
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{localeNames[currentLocale as keyof typeof localeNames]}</span>
        <ChevronDownIcon className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
          <div className="py-1">
            {locales.map((l) => (
              <button
                key={l}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  l === currentLocale
                    ? 'bg-gray-100 dark:bg-gray-800 font-medium'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => handleLocaleChange(l)}
              >
                {localeNames[l as keyof typeof localeNames]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 