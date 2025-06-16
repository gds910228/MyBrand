'use client';

import { useTranslations as useTranslationsOriginal } from 'next-intl';
import { useLocale as useLocaleOriginal } from 'next-intl';

// 重新导出next-intl的客户端钩子
export function useTranslations(namespace?: string) {
  return useTranslationsOriginal(namespace);
}

export function useLocale() {
  return useLocaleOriginal();
}

// 为便于备用添加额外的辅助函数
export function getLocalizedPath(locale: string, path: string) {
  return `/${locale}${path === '/' ? '' : path}`;
} 