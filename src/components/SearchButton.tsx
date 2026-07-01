"use client";

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { searchTexts } from '@/lib/searchIndex';
import type { Locale } from '@/i18n/locales';

interface SearchButtonProps {
  locale: Locale;
  /** 设为 true 时显示 ⌘K 徽章（仅在桌面用）。 */
  showHint?: boolean;
  /** 由父组件传入：打开命令面板。 */
  onOpen: () => void;
}

/**
 * 搜索触发按钮 —— 不再包含 ⌘K 监听或 CommandPalette。
 * 快捷键与面板由 Navbar 统一管理，避免两个实例重复注册。
 */
export default function SearchButton({ locale, showHint = false, onOpen }: SearchButtonProps) {
  const t = searchTexts[locale];
  const [isMac, setIsMac] = useState(false);

  // 避免 hydration 不匹配：仅在客户端读取 navigator.platform。
  useEffect(() => {
    setIsMac(/mac|darwin|i(os|pad)/i.test(navigator.platform || ''));
  }, []);

  const shortcut = isMac ? '⌘K' : 'Ctrl+K';

  // 带提示徽章的桌面版本。
  if (showHint) {
    return (
      <button
        onClick={onOpen}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-neutral-dark dark:text-dark-neutral-dark hover:text-primary dark:hover:text-dark-primary hover:bg-neutral-light dark:hover:bg-dark-neutral-light transition-all duration-200"
        aria-label={t.trigger}
        aria-keyshortcuts="Control+K Meta+K"
      >
        <FontAwesomeIcon icon={faSearch} className="h-4 w-4" />
        <span className="hidden lg:inline text-xs font-medium">{t.trigger}</span>
        <kbd className="hidden sm:inline-flex text-[10px] px-1.5 py-0.5 rounded border border-neutral-light dark:border-dark-neutral-light text-neutral-dark/50 dark:text-dark-neutral-dark/50 font-mono">
          {shortcut}
        </kbd>
      </button>
    );
  }

  // 纯图标版本（移动端用）。
  return (
    <button
      onClick={onOpen}
      className="p-2 rounded-md text-neutral-dark dark:text-dark-neutral-dark hover:text-primary dark:hover:text-dark-primary hover:bg-neutral-light dark:hover:bg-dark-neutral-light transition-all duration-200"
      aria-label={t.trigger}
    >
      <FontAwesomeIcon icon={faSearch} className="h-5 w-5" />
    </button>
  );
}
