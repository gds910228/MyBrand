"use client";

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import CommandPalette from './CommandPalette';
import { searchTexts } from '@/lib/searchIndex';
import type { Locale } from '@/i18n/locales';

interface SearchButtonProps {
  locale: Locale;
}

/**
 * 导航栏搜索入口：点击或按 ⌘K / Ctrl+K 唤起命令面板（CommandPalette）。
 * 旧的内联下拉 + 跳转 /search 的实现已被命令面板取代。
 */
export default function SearchButton({ locale }: SearchButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = searchTexts[locale];

  // 全局快捷键 ⌘K / Ctrl+K 切换面板。
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-md text-neutral-dark dark:text-dark-neutral-dark hover:text-primary dark:hover:text-dark-primary hover:bg-neutral-light dark:hover:bg-dark-neutral-light transition-all duration-200"
        aria-label={t.trigger}
        aria-keyshortcuts="Control+K Meta+K"
        title={`${t.trigger} (Ctrl/⌘ + K)`}
      >
        <FontAwesomeIcon icon={faSearch} className="h-5 w-5" />
      </button>

      <CommandPalette isOpen={isOpen} onClose={() => setIsOpen(false)} locale={locale} />
    </>
  );
}
