import React from 'react';
import type { Metadata } from 'next';
import ServicesPageContent from '@/components/ServicesPageContent';

export const metadata: Metadata = {
  title: '服务 · MisoTech',
  description:
    'AI 应用开发、企业系统打造、产品 MVP 与上线、技术顾问——前大厂高级工程师，世界 500 强客户交付经验。',
};

export default function ServicesPageZh() {
  return <ServicesPageContent locale="zh" />;
}
