"use client";

import Image from "next/image";
import { useState } from "react";

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

  const handleError = () => {
    if (!hasError) {
      console.error('Blog cover image failed to load:', src);
      setCurrentSrc('/images/covers/placeholder.svg');
      setHasError(true);
    }
  };

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      priority={priority}
      onError={handleError}
    />
  );
};

export default BlogCoverImage;