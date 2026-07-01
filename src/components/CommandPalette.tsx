'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFileAlt, faFolder, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useSearch } from '@/hooks/useSearch';
import { highlight, searchTexts, type SearchHit } from '@/lib/searchIndex';
import type { Locale } from '@/i18n/locales';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  locale: Locale;
}

/**
 * ⌘K / Ctrl+K 命令面板。
 * - 客户端 MiniSearch 模糊/前缀搜索（经 useSearch hook，索引模块级缓存）。
 * - 结果按 Blog / Project 分组、命中片段高亮、上下键导航 + 回车跳转、Esc 关闭。
 * - a11y：role=listbox + aria-activedescendant + 焦点锁定（Tab 不逃出面板）。
 * - 空态 / 加载态 / 无结果态齐全；深色模式与移动端适配。
 *
 * 说明：未直接复用 Modal 组件——命令面板需顶部对齐、无标题栏、自管键盘导航，
 * 这里用与 Modal 相同的 framer-motion 模式实现专用浮层。
 */
export default function CommandPalette({ isOpen, onClose, locale }: CommandPaletteProps) {
  const router = useRouter();
  const t = searchTexts[locale];
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const { query, setQuery, results, total, status, indexReady } = useSearch(locale, {
    enabled: isOpen,
    debounceMs: 150,
  });

  useEffect(() => setMounted(true), []);

  // 打开时聚焦输入、重置选中项；关闭时清空查询，下次打开是干净空态（与主流命令面板一致）。
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(0);
      // 等动画/portal 就绪后聚焦。
      const id = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(id);
    }
    setQuery('');
    setActiveIndex(0);
  }, [isOpen, setQuery]);

  // 结果变化时把选中项收敛到合法范围。
  useEffect(() => {
    setActiveIndex((i) => (total === 0 ? 0 : Math.min(i, total - 1)));
  }, [total]);

  const buildHref = useCallback(
    (hit: SearchHit) => {
      const prefix = locale === 'zh' ? '/zh' : '';
      return hit.type === 'blog' ? `${prefix}/blog/${hit.slug}` : `${prefix}/projects/${hit.slug}`;
    },
    [locale],
  );

  const goTo = useCallback(
    (hit: SearchHit | undefined) => {
      if (!hit) return;
      // 先关闭面板再跳转：无论目标页加载快慢，面板都瞬时消失，点击与回车手感一致。
      onClose();
      router.push(buildHref(hit));
    },
    [router, buildHref, onClose],
  );

  // 把选中项滚动到可视区。
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  // 用 ref 保存最新的结果与选中项，供键盘处理读取，彻底避免闭包过期
  // （此前 handler 绑在 framer-motion 容器上会拿到过期的空结果，导致回车无效）。
  const navStateRef = useRef({ flat: results.flat, activeIndex, total });
  navStateRef.current = { flat: results.flat, activeIndex, total };

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const { flat, activeIndex: idx, total: count } = navStateRef.current;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (count === 0 ? 0 : (i + 1) % count));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (count === 0 ? 0 : (i - 1 + count) % count));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        goTo(flat[idx]);
        return;
      }
      // 焦点锁定：Tab / Shift+Tab 不逃出面板。
      if (e.key === 'Tab') {
        e.preventDefault();
      }
    },
    [goTo, onClose],
  );

  const groups = useMemo(
    () =>
      [
        { key: 'blog' as const, label: t.groupBlog, icon: faFileAlt, items: results.blog },
        { key: 'project' as const, label: t.groupProject, icon: faFolder, items: results.project },
      ].filter((g) => g.items.length > 0),
    [results, t],
  );

  const showEmpty = !query.trim();
  const showNoResults = !!query.trim() && status === 'ready' && total === 0;
  const isLoadingIndex = status === 'loading-index' && !indexReady;
  const isSearching = status === 'searching';

  if (!mounted || !isOpen) return null;

  // 给每个分组项分配全局扁平索引（与 results.flat 一致：blog 在前）。
  let runningIndex = -1;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-black/50 dark:bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-[61] flex items-start justify-center p-4 pt-[12vh] pointer-events-none">
            <motion.div
              ref={containerRef}
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-xl bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-2xl pointer-events-auto overflow-hidden border border-neutral-light dark:border-dark-neutral-light"
              role="dialog"
              aria-modal="true"
              aria-label={t.trigger}
            >
              {/* 输入区 */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-light/60 dark:border-dark-neutral-light/40">
                <FontAwesomeIcon
                  icon={isLoadingIndex || isSearching ? faSpinner : faSearch}
                  className={`h-4 w-4 text-neutral-dark dark:text-dark-neutral-dark ${
                    isLoadingIndex || isSearching ? 'animate-spin' : ''
                  }`}
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={t.placeholder}
                  className="flex-1 bg-transparent border-none outline-none text-neutral-darker dark:text-dark-neutral-darker placeholder-neutral-dark/50 dark:placeholder-dark-neutral-dark/50"
                  role="combobox"
                  aria-expanded={total > 0}
                  aria-controls="command-palette-list"
                  aria-activedescendant={total > 0 ? `cp-item-${activeIndex}` : undefined}
                  autoComplete="off"
                  spellCheck={false}
                />
                <kbd className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded border border-neutral-light dark:border-dark-neutral-light text-neutral-dark/60 dark:text-dark-neutral-dark/60">
                  esc
                </kbd>
              </div>

              {/* 结果区 */}
              <div
                ref={listRef}
                id="command-palette-list"
                role="listbox"
                aria-label={t.trigger}
                className="max-h-[55vh] overflow-y-auto py-2"
              >
                {isLoadingIndex ? (
                  <StateRow text={t.loading} />
                ) : showEmpty ? (
                  <StateRow text={t.empty} />
                ) : showNoResults ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-neutral-darker dark:text-dark-neutral-darker font-medium">
                      {t.noResults}
                    </p>
                    <p className="text-sm text-neutral-dark/60 dark:text-dark-neutral-dark/60 mt-1">
                      {t.noResultsHint}
                    </p>
                  </div>
                ) : (
                  groups.map((group) => (
                    <div key={group.key} className="mb-1">
                      <div className="px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-neutral-dark/50 dark:text-dark-neutral-dark/50">
                        {group.label}
                      </div>
                      {group.items.map((hit) => {
                        runningIndex += 1;
                        const idx = runningIndex;
                        const active = idx === activeIndex;
                        return (
                          <button
                            key={hit.id}
                            type="button"
                            id={`cp-item-${idx}`}
                            data-idx={idx}
                            role="option"
                            aria-selected={active}
                            onClick={() => goTo(hit)}
                            onMouseEnter={() => setActiveIndex(idx)}
                            className={`w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors ${
                              active
                                ? 'bg-primary-light/15 dark:bg-dark-primary-light/15'
                                : 'hover:bg-neutral-light/60 dark:hover:bg-dark-neutral-light/40'
                            }`}
                          >
                            <FontAwesomeIcon
                              icon={group.icon}
                              className="h-4 w-4 mt-1 flex-shrink-0 text-primary dark:text-dark-primary"
                            />
                            <span className="flex-1 min-w-0">
                              <span
                                className="block text-sm font-medium text-neutral-darker dark:text-dark-neutral-darker truncate [&_mark]:bg-primary-light/50 [&_mark]:dark:bg-dark-primary/40 [&_mark]:text-inherit [&_mark]:rounded-sm"
                                dangerouslySetInnerHTML={{ __html: highlight(hit.title, query) }}
                              />
                              {hit.excerpt && (
                                <span
                                  className="block text-xs text-neutral-dark/70 dark:text-dark-neutral-dark/70 truncate mt-0.5 [&_mark]:bg-primary-light/40 [&_mark]:dark:bg-dark-primary/30 [&_mark]:text-inherit [&_mark]:rounded-sm"
                                  dangerouslySetInnerHTML={{
                                    __html: highlight(hit.excerpt, query, 60),
                                  }}
                                />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* 底部提示 */}
              <div className="px-4 py-2 border-t border-neutral-light/60 dark:border-dark-neutral-light/40 text-[11px] text-neutral-dark/50 dark:text-dark-neutral-dark/50 flex items-center justify-between">
                <span>{t.navHint}</span>
                {!!query.trim() && status === 'ready' && total > 0 && (
                  <span>{t.resultsFor(total, query.trim())}</span>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function StateRow({ text }: { text: string }) {
  return (
    <div className="px-4 py-8 text-center text-sm text-neutral-dark/60 dark:text-dark-neutral-dark/60">
      {text}
    </div>
  );
}
