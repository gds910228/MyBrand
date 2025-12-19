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

  // 检查是否是Notion/AWS的签名URL
  const isNotionSignedUrl = useCallback((url: string) => {
    return url.includes('amazonaws.com') && url.includes('X-Amz-Signature');
  }, []);

  // 处理图片加载错误
  const handleError = useCallback(() => {
    console.warn(`[FallbackImage] 图片加载失败: ${currentSrc.substring(0, 100)}...`);

    // 如果是AWS签名URL且重试次数少于2次，说明可能是签名过期
    // 这种情况下不应该修改原URL，而是直接回退到占位图
    if (isNotionSignedUrl(currentSrc)) {
      console.log(`[FallbackImage] AWS签名URL加载失败，直接回退到占位图`);
      setCurrentSrc(fallbackSrc);
      return;
    }

    // 非签名URL的回退逻辑
    if (currentSrc !== fallbackSrc) {
      console.log(`[FallbackImage] 回退到占位图: ${fallbackSrc}`);
      setCurrentSrc(fallbackSrc);
    }
  }, [currentSrc, fallbackSrc, isNotionSignedUrl]);

  useEffect(() => {
    const next = src && String(src).trim().length > 0 ? String(src) : fallbackSrc;
    setCurrentSrc(next);
  }, [src, fallbackSrc]);

  return (
    <Image
      {...rest}
      alt={alt}
      src={currentSrc}
      onError={handleError}
      // 为Notion/AWS签名URL使用unoptimized避免签名验证问题
      {...(isNotionSignedUrl(currentSrc) && {
        unoptimized: true,
        priority: false
      })}
    />
  );
};

export default FallbackImage;