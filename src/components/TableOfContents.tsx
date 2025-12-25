"use client";

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faArrowUp } from '@fortawesome/free-solid-svg-icons';

export interface Heading {
  id: string;
  text: string;
  level: number;
}

export interface TableOfContentsProps {
  /**
   * 标题列表
   */
  headings: Heading[];
  /**
   * 语言区域设置
   */
  locale?: 'en' | 'zh';
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ headings, locale = 'en' }) => {
  const [activeId, setActiveId] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const text = locale === 'zh' ? '目录' : 'Contents';
  const backToTopText = locale === 'zh' ? '返回顶部' : 'Back to Top';

  useEffect(() => {
    // 为标题元素添加 ID
    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element && !element.id) {
        element.id = heading.id;
      }
    });

    // 滚动监听 - 用于高亮当前章节
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-100px 0px -80% 0px', // 当标题进入顶部 20% 区域时激活
        threshold: 0,
      }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    // 监听页面滚动以显示/隐藏返回顶部按钮
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // 初始检查

    return () => {
      headings.forEach((heading) => {
        const element = document.getElementById(heading.id);
        if (element) {
          observer.unobserve(element);
        }
      });
      window.removeEventListener('scroll', handleScroll);
    };
  }, [headings]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // 顶部导航栏高度
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });

      // 更新激活状态
      setActiveId(id);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // 如果没有标题，不显示组件
  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className="relative">
      {/* 桌面端目录 - 使用 fixed 定位确保始终可见 */}
      <div className="hidden lg:block">
        <div className="fixed right-4 top-24 w-64 max-h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="bg-white/80 dark:bg-dark-bg-secondary/80 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-neutral-light/20 dark:border-dark-neutral-light/20">
            <h3 className="text-sm font-bold text-neutral-darker dark:text-dark-neutral-darker mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faList} className="w-4 h-4 text-primary" />
              {text}
            </h3>
            <ul className="space-y-2 text-sm border-l-2 border-neutral-light dark:border-dark-neutral-light pl-4">
              {headings.map((heading) => {
                const isActive = activeId === heading.id;
                const indent = heading.level > 1 ? (heading.level - 1) * 12 : 0;

                return (
                  <li
                    key={heading.id}
                    style={{ paddingLeft: `${indent}px` }}
                    className="transition-all duration-200"
                  >
                    <a
                      href={`#${heading.id}`}
                      onClick={(e) => handleClick(e, heading.id)}
                      className={`block py-1 transition-colors duration-200 ${
                        isActive
                          ? 'text-primary dark:text-dark-primary font-medium border-l-2 border-primary -ml-[6px] pl-[10px]'
                          : 'text-neutral-dark dark:text-dark-neutral-dark hover:text-primary dark:hover:text-dark-primary'
                      }`}
                    >
                      {heading.text}
                    </a>
                  </li>
                );
              })}
            </ul>

            {/* 返回顶部按钮 */}
            {showBackToTop && (
              <button
                onClick={scrollToTop}
                className="mt-6 flex items-center gap-2 text-sm text-primary dark:text-dark-primary hover:underline transition-colors duration-200"
                title={backToTopText}
              >
                <FontAwesomeIcon icon={faArrowUp} className="w-4 h-4" />
                <span>{backToTopText}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 移动端目录（可折叠） */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-between px-4 py-3 glass-surface border border-white/20 dark:border-white/10 rounded-lg"
        >
          <span className="font-medium text-neutral-darker dark:text-dark-neutral-darker flex items-center gap-2">
            <FontAwesomeIcon icon={faList} className="w-4 h-4 text-primary" />
            {text}
          </span>
          <FontAwesomeIcon
            icon={faList}
            className={`w-4 h-4 text-neutral-dark dark:text-dark-neutral-dark transition-transform duration-200 ${
              isCollapsed ? 'rotate-180' : ''
            }`}
          />
        </button>

        {!isCollapsed && (
          <>
            <ul className="mt-3 space-y-2 text-sm">
              {headings.map((heading) => {
                const isActive = activeId === heading.id;
                const indent = heading.level > 1 ? (heading.level - 1) * 12 : 0;

                return (
                  <li
                    key={heading.id}
                    style={{ paddingLeft: `${16 + indent}px` }}
                    className="transition-all duration-200"
                  >
                    <a
                      href={`#${heading.id}`}
                      onClick={(e) => handleClick(e, heading.id)}
                      className={`block py-2 border-l-2 transition-colors duration-200 ${
                        isActive
                          ? 'text-primary dark:text-dark-primary font-medium border-primary bg-primary-light/10 dark:bg-dark-primary-light/10'
                          : 'text-neutral-dark dark:text-dark-neutral-dark border-transparent hover:text-primary dark:hover:text-dark-primary hover:border-neutral-light dark:hover:border-dark-neutral-light'
                      }`}
                    >
                      {heading.text}
                    </a>
                  </li>
                );
              })}
            </ul>

            {/* 返回顶部按钮 - 移动端 */}
            {showBackToTop && (
              <button
                onClick={scrollToTop}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-sm text-primary dark:text-dark-primary bg-primary-light/10 dark:bg-dark-primary-light/10 rounded-lg hover:bg-primary-light/20 dark:hover:bg-dark-primary-light/20 transition-colors duration-200"
              >
                <FontAwesomeIcon icon={faArrowUp} className="w-4 h-4" />
                <span>{backToTopText}</span>
              </button>
            )}
          </>
        )}
      </div>
    </nav>
  );
};

export default TableOfContents;
