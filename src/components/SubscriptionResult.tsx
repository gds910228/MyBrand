'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getSubscribeMessages } from '@/lib/subscribeMessages';

interface Props {
  locale: 'en' | 'zh';
  kind: 'confirm' | 'unsubscribe';
}

/** 确认/退订结果展示组件，按 ?status= 渲染不同状态。 */
const SubscriptionResult: React.FC<Props> = ({ locale, kind }) => {
  const searchParams = useSearchParams();
  const status = searchParams.get('status') || 'invalid';
  const messages = getSubscribeMessages(locale);

  let title: string;
  let desc = '';
  let showHome = true;

  if (kind === 'confirm') {
    const t = messages.confirm;
    if (status === 'confirmed') { title = t.title; desc = t.desc; }
    else if (status === 'already') { title = t.already; desc = ''; }
    else if (status === 'demo') { title = t.title; desc = t.demoDesc; }
    else { title = t.invalid; }
  } else {
    const t = messages.unsubscribe;
    if (status === 'done') { title = t.title; desc = t.desc; }
    else if (status === 'demo') { title = t.title; desc = t.demoDesc; }
    else { title = t.invalid; }
  }

  const homeHref = locale === 'zh' ? '/zh' : '/';

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
          {title}
        </h1>
        {desc && (
          <p className="text-neutral-600 dark:text-neutral-400 mb-8">{desc}</p>
        )}
        {showHome && (
          <Link
            href={homeHref}
            className="inline-block px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            {kind === 'confirm' ? messages.confirm.backHome : messages.unsubscribe.resubscribe}
          </Link>
        )}
      </div>
    </main>
  );
};

export default SubscriptionResult;
