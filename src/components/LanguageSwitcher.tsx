"use client";

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { locales, localeNames, Locale } from '@/i18n/locales';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export default function LanguageSwitcher() {
  const t = useTranslations('language');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const handleLocaleChange = (newLocale: Locale) => {
    // 替换当前URL中的语言部分
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPathname);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{localeNames[locale]}</span>
        <ChevronDownIcon className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
          <div className="py-1">
            {locales.map((l) => (
              <button
                key={l}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  l === locale
                    ? 'bg-gray-100 dark:bg-gray-800 font-medium'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => handleLocaleChange(l)}
              >
                {localeNames[l]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 