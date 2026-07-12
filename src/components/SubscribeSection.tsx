'use client';

import React, { useEffect } from 'react';
import SubscribeForm from './SubscribeForm';
import PushSubscribeButton from './PushSubscribeButton';
import { usePathname } from 'next/navigation';
import { getSubscribeMessages } from '@/lib/subscribeMessages';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

const SubscribeSection: React.FC = () => {
  const pathname = usePathname();
  const locale = pathname.startsWith('/zh') ? 'zh' : 'en';
  const t = getSubscribeMessages(locale);

  // 注册 Service Worker（仅 production 或有 VAPID key 时）
  useEffect(() => {
    if (VAPID_PUBLIC && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW 注册失败不影响页面其他功能
      });
    }
  }, []);

  return (
    <section className="py-12 px-4">
      <div className="max-w-3xl mx-auto rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 p-8">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          {t.sectionTitle}
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          {t.sectionDesc}
        </p>

        <SubscribeForm />

        <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
            {t.push.title}
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
            {t.push.desc}
          </p>
          <PushSubscribeButton />
        </div>

        {!VAPID_PUBLIC && (
          <p className="mt-4 text-xs text-amber-600 dark:text-amber-500">
            {t.demoMode}
          </p>
        )}
      </div>
    </section>
  );
};

export default SubscribeSection;
