"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';

interface SearchButtonProps {
  locale: 'en' | 'zh';
}

export default function SearchButton({ locale }: SearchButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);

  // 热门搜索关键词
  const popularSearches = locale === 'zh'
    ? ['Next.js', 'TypeScript', 'React', 'AI', '人工智能', 'Notion', 'Web开发', '前端']
    : ['Next.js', 'TypeScript', 'React', 'AI', 'Machine Learning', 'Notion', 'Web Development', 'Frontend'];

  // 从本地存储加载最近搜索
  useEffect(() => {
    const stored = localStorage.getItem(`recent-searches-${locale}`);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent searches:', e);
      }
    }
  }, [locale]);

  // 保存搜索到本地存储
  const saveSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem(`recent-searches-${locale}`, JSON.stringify(updated));
  };

  // 文本配置
  const texts = {
    en: {
      placeholder: 'Search articles and projects...',
      buttonText: 'Search',
      recent: 'Recent',
      popular: 'Popular Searches',
      noRecent: 'No recent searches'
    },
    zh: {
      placeholder: '搜索文章和项目...',
      buttonText: '搜索',
      recent: '最近搜索',
      popular: '热门搜索',
      noRecent: '暂无搜索记录'
    }
  };

  const currentTexts = texts[locale];

  // 点击外部关闭搜索框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && !event.target || !(event.target as Element).closest('.search-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 打开搜索框时聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // 处理搜索
  const handleSearch = (e: React.FormEvent, query?: string) => {
    e?.preventDefault();
    const finalQuery = query || searchQuery;
    if (finalQuery.trim()) {
      saveSearch(finalQuery);
      const searchUrl = locale === 'zh' ? `/zh/search?q=${encodeURIComponent(finalQuery.trim())}` : `/search?q=${encodeURIComponent(finalQuery.trim())}`;
      router.push(searchUrl);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  // 快速搜索（点击建议）
  const handleQuickSearch = (query: string) => {
    setSearchQuery(query);
    const syntheticEvent = new Event('submit') as any;
    handleSearch(syntheticEvent, query);
  };

  // 键盘快捷键 (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(!isOpen);
      }
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="search-container relative">
      {/* 搜索按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-md text-neutral-dark dark:text-dark-neutral-dark hover:text-primary dark:hover:text-dark-primary hover:bg-neutral-light dark:hover:bg-dark-neutral-light transition-all duration-200"
        aria-label="Search"
        title={currentTexts.buttonText + (typeof window !== 'undefined' && window.innerWidth > 768 ? ' (Ctrl+K)' : '')}
      >
        <FontAwesomeIcon icon={faSearch} className="h-5 w-5" />
      </button>

      {/* 搜索弹窗 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-dark-bg-primary border border-neutral-light dark:border-dark-neutral-light rounded-lg shadow-lg dark:shadow-neutral-black/50 z-50">
          <form onSubmit={handleSearch} className="p-4 border-b border-neutral-light/20 dark:border-dark-neutral-light/20">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon
                icon={faSearch}
                className="h-4 w-4 text-neutral-dark dark:text-dark-neutral-dark"
              />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={currentTexts.placeholder}
                className="flex-1 bg-transparent border-none outline-none text-neutral-darker dark:text-dark-neutral-darker placeholder-neutral-dark/50 dark:placeholder-dark-neutral-dark/50"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-neutral-dark dark:text-dark-neutral-dark hover:text-primary dark:hover:text-dark-primary transition-colors"
                aria-label="Close search"
              >
                <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* 搜索建议 */}
          <div className="max-h-60 overflow-y-auto">
            {/* 最近搜索 */}
            {recentSearches.length > 0 && (
              <div className="border-b border-neutral-light/20 dark:border-dark-neutral-light/20">
                <div className="px-4 py-2">
                  <h3 className="text-xs font-medium text-neutral-dark/60 dark:text-dark-neutral-dark/60 uppercase tracking-wide">
                    {currentTexts.recent}
                  </h3>
                </div>
                <div className="pb-2">
                  {recentSearches.map((term, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickSearch(term)}
                      className="w-full px-4 py-2 text-left text-sm text-neutral-dark dark:text-dark-neutral-dark hover:bg-neutral-light dark:hover:bg-dark-neutral-light transition-colors flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={faSearch} className="h-3 w-3 text-neutral-dark/40 dark:text-dark-neutral-dark/40" />
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 热门搜索 */}
            <div>
              <div className="px-4 py-2">
                <h3 className="text-xs font-medium text-neutral-dark/60 dark:text-dark-neutral-dark/60 uppercase tracking-wide">
                  {currentTexts.popular}
                </h3>
              </div>
              <div className="pb-3">
                <div className="px-4 flex flex-wrap gap-2">
                  {popularSearches.slice(0, 6).map((term, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickSearch(term)}
                      className="px-3 py-1 text-xs bg-neutral-light dark:bg-dark-neutral-light text-neutral-dark dark:text-dark-neutral-dark rounded-full hover:bg-primary-light/20 dark:hover:bg-dark-primary-light/20 hover:text-primary dark:hover:text-dark-primary transition-all duration-200"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 快捷提示 */}
          <div className="px-4 pb-3 pt-2 border-t border-neutral-light/20 dark:border-dark-neutral-light/20">
            <p className="text-xs text-neutral-dark/60 dark:text-dark-neutral-dark/60">
              {typeof window !== 'undefined' && window.innerWidth > 768
                ? (locale === 'zh' ? '按 Ctrl+K 快速搜索' : 'Press Ctrl+K for quick search')
                : (locale === 'zh' ? '点击搜索图标搜索' : 'Click search icon to search')
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}