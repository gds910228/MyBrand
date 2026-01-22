"use client";

import Image, { ImageProps } from "next/image";
import React, { useEffect, useState, useCallback, useRef } from "react";

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
 * - 改进了错误检测和占位图回退逻辑
 */
const FallbackImage: React.FC<FallbackImageProps> = ({
  src,
  alt,
  fallbackSrc = "/images/covers/placeholder.svg",
  ...rest
}) => {
  const initial = src && String(src).trim().length > 0 ? String(src) : fallbackSrc;
  const [currentSrc, setCurrentSrc] = useState<string>(initial);
  const [hasError, setHasError] = useState<boolean>(false);
  const errorRef = useRef<boolean>(false);

  // 检查是否是Notion/AWS的签名URL
  const isNotionSignedUrl = useCallback((url: string) => {
    return url.includes('amazonaws.com') && url.includes('X-Amz-Signature');
  }, []);

  // 检查是否是本地图片
  const isLocalImage = useCallback((url: string) => {
    return url.startsWith('/') || url.startsWith('data:');
  }, []);

  // 处理图片加载错误
  const handleError = useCallback(() => {
    // 防止重复触发
    if (errorRef.current) return;
    errorRef.current = true;
    setHasError(true);

    console.warn(`[FallbackImage] 图片加载失败: ${currentSrc.substring(0, 100)}...`);

    // 无论是什么类型的URL，加载失败都直接回退到占位图
    if (currentSrc !== fallbackSrc) {
      console.log(`[FallbackImage] 回退到占位图: ${fallbackSrc}`);
      setCurrentSrc(fallbackSrc);
    }
  }, [currentSrc, fallbackSrc]);

  // 处理图片加载成功
  const handleLoad = useCallback(() => {
    errorRef.current = false;
    setHasError(false);
  }, []);

  useEffect(() => {
    const next = src && String(src).trim().length > 0 ? String(src) : fallbackSrc;

    // 如果源URL改变，重置错误状态
    if (next !== currentSrc) {
      errorRef.current = false;
      setHasError(false);
      setCurrentSrc(next);
    }
  }, [src, fallbackSrc, currentSrc]);

  // 对于AWS签名URL或已知的临时URL，始终使用unoptimized
  const shouldUnoptimize = isNotionSignedUrl(currentSrc) && !hasError;

  return (
    <Image
      {...rest}
      alt={alt}
      src={currentSrc}
      onError={handleError}
      onLoad={handleLoad}
      // 优先使用占位图时启用优化
      unoptimized={shouldUnoptimize}
      // 添加额外的容错属性
      {...(hasError && {
        src: fallbackSrc,
      })}
    />
  );
};

export default FallbackImage;