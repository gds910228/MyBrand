"use client";

import Image, { ImageProps } from "next/image";
import React, { useEffect, useState } from "react";

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
 */
const FallbackImage: React.FC<FallbackImageProps> = ({
  src,
  alt,
  fallbackSrc = "/images/covers/placeholder.svg",
  ...rest
}) => {
  const initial = src && String(src).trim().length > 0 ? String(src) : fallbackSrc;
  const [currentSrc, setCurrentSrc] = useState<string>(initial);

  useEffect(() => {
    const next = src && String(src).trim().length > 0 ? String(src) : fallbackSrc;
    setCurrentSrc(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, fallbackSrc]);

  return (
    <Image
      {...rest}
      alt={alt}
      src={currentSrc}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
};

export default FallbackImage;