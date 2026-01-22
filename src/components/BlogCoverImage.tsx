"use client";

import Image from "next/image";
import { useState, useCallback, useRef, useEffect } from "react";

interface BlogCoverImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * BlogCoverImage - 专门用于博客文章页面的封面图片
 * - Client Component，支持onError事件处理
 * - 自动回退到占位图
 * - 增强的错误处理和AWS签名URL支持
 */
const BlogCoverImage: React.FC<BlogCoverImageProps> = ({
  src,
  alt,
  className,
  sizes = "(max-width: 1024px) 100vw, 800px",
  priority = false
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(src);
  const [hasError, setHasError] = useState(false);
  const errorRef = useRef<boolean>(false);

  // 检查是否是Notion/AWS的签名URL
  const isNotionSignedUrl = useCallback((url: string) => {
    return url.includes('amazonaws.com') && url.includes('X-Amz-Signature');
  }, []);

  const handleError = useCallback(() => {
    // 防止重复触发
    if (errorRef.current) return;
    errorRef.current = true;
    setHasError(true);

    console.error('[BlogCoverImage] 图片加载失败:', currentSrc.substring(0, 100));
    console.log('[BlogCoverImage] 回退到占位图');

    setCurrentSrc('/images/covers/placeholder.svg');
  }, [currentSrc]);

  const handleLoad = useCallback(() => {
    errorRef.current = false;
    setHasError(false);
  }, []);

  // 当src prop改变时，重置状态
  useEffect(() => {
    if (src !== currentSrc) {
      errorRef.current = false;
      setHasError(false);
      setCurrentSrc(src);
    }
  }, [src, currentSrc]);

  // 对于AWS签名URL，使用unoptimized避免签名验证问题
  const shouldUnoptimize = isNotionSignedUrl(currentSrc) && !hasError;

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      priority={priority}
      onError={handleError}
      onLoad={handleLoad}
      unoptimized={shouldUnoptimize}
    />
  );
};

export default BlogCoverImage;