"use client";

import Image, { ImageProps } from "next/image";
import React, { useEffect, useState, useCallback } from "react";

type FallbackImageProps = Omit<ImageProps, "src" | "alt"> & {
  src?: string | null | undefined;
  alt: string;
  fallbackSrc?: string;
};

/**
 * FallbackImage
 * - 用于远端图片 404/加载失败时自动回退到占位图
 * - 兼容 fill 或 width/height 两种用法
 * - 默认占位图为 /images/covers/placeholder.svg
 * - 增强了AWS签名URL失效的处理
 */
const FallbackImage: React.FC<FallbackImageProps> = ({
  src,
  alt,
  fallbackSrc = "/images/covers/placeholder.svg",
  ...rest
}) => {
  const initial = src && String(src).trim().length > 0 ? String(src) : fallbackSrc;
  const [currentSrc, setCurrentSrc] = useState<string>(initial);
  const [retryCount, setRetryCount] = useState(0);

  // 检查是否是Notion/AWS的签名URL
  const isNotionSignedUrl = useCallback((url: string) => {
    return url.includes('amazonaws.com') && url.includes('X-Amz-Signature');
  }, []);

  // 处理图片加载错误
  const handleError = useCallback(() => {
    console.warn(`[FallbackImage] 图片加载失败: ${currentSrc.substring(0, 100)}...`);

    // 如果是AWS签名URL且重试次数少于2次，可能需要刷新URL
    if (isNotionSignedUrl(currentSrc) && retryCount < 2) {
      setRetryCount(prev => prev + 1);
      // 延迟重试，避免频繁请求
      setTimeout(() => {
        setCurrentSrc(currentSrc + `&retry=${Date.now()}`);
      }, 1000 * (retryCount + 1));
      return;
    }

    // 否则直接回退到占位图
    if (currentSrc !== fallbackSrc) {
      console.log(`[FallbackImage] 回退到占位图: ${fallbackSrc}`);
      setCurrentSrc(fallbackSrc);
    }
  }, [currentSrc, fallbackSrc, isNotionSignedUrl, retryCount]);

  useEffect(() => {
    const next = src && String(src).trim().length > 0 ? String(src) : fallbackSrc;
    setCurrentSrc(next);
    setRetryCount(0); // 重置重试计数
  }, [src, fallbackSrc]);

  return (
    <Image
      {...rest}
      alt={alt}
      src={currentSrc}
      onError={handleError}
      // 为Notion图片添加更长的缓存时间
      {...(isNotionSignedUrl(currentSrc) && {
        unoptimized: false,
        priority: false
      })}
    />
  );
};

export default FallbackImage;