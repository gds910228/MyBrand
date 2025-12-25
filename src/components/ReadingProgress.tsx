"use client";

import { useEffect, useState } from 'react';

export interface ReadingProgressProps {
  /**
   * 进度条颜色，默认为渐变色
   */
  color?: string;
  /**
   * 进度条高度（像素）
   */
  height?: number;
  /**
   * 进度条位置（fixed/top/sticky）
   */
  position?: 'fixed' | 'sticky';
  /**
   * z-index 值
   */
  zIndex?: number;
  /**
   * 是否显示百分比文字
   */
  showPercentage?: boolean;
}

const ReadingProgress: React.FC<ReadingProgressProps> = ({
  color,
  height = 3,
  position = 'fixed',
  zIndex = 50,
  showPercentage = false,
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;

      // 计算进度百分比
      const progressPercentage = totalHeight > 0 ? (currentScroll / totalHeight) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, progressPercentage)));
    };

    // 节流处理，避免频繁计算
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    handleScroll(); // 初始化

    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
    };
  }, []);

  const positionClass = position === 'fixed' ? 'fixed top-0 left-0 right-0' : 'sticky top-0';

  return (
    <>
      <div
        className={`${positionClass} w-full bg-neutral-200 dark:bg-neutral-700`}
        style={{
          height: `${height}px`,
          zIndex,
        }}
      >
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 transition-all duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {showPercentage && progress > 5 && (
        <div
          className={`fixed top-4 right-4 px-3 py-1 rounded-full text-xs font-medium bg-neutral-light dark:bg-dark-neutral-light text-neutral-dark dark:text-dark-neutral-dark shadow-lg`}
          style={{ zIndex: zIndex - 1 }}
        >
          {Math.round(progress)}%
        </div>
      )}
    </>
  );
};

export default ReadingProgress;
