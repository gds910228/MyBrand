"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  
  // 获取当前语言
  const currentLocale = pathname.startsWith('/zh') ? 'zh' : 'en';

  const handleLocaleChange = (newLocale: string) => {
    if (newLocale === currentLocale) {
      setIsOpen(false);
      return;
    }
    
    // 构建新路径（保留查询参数）
    let newPath = '';
    
    // 英文 -> 中文：添加 /zh 前缀
    if (newLocale === 'zh' && currentLocale === 'en') {
      if (pathname === '/') {
        newPath = '/zh';
      } else {
        newPath = `/zh${pathname}`;
      }
    } 
    // 中文 -> 英文：移除 /zh 前缀
    else if (newLocale === 'en' && currentLocale === 'zh') {
      if (pathname === '/zh') {
        newPath = '/';
      } else {
        newPath = pathname.replace(/^\/zh/, '');
      }
    } else {
      newPath = pathname;
    }

    // 保留当前查询参数（如 tag/page/pageSize/sort）
    const qs = searchParams.toString();
    if (qs) {
      newPath = `${newPath}?${qs}`;
    }
    
    console.log(`切换语言：${currentLocale} -> ${newLocale}，新路径：${newPath}`);
    
    // 导航到新路径
    router.push(newPath);
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