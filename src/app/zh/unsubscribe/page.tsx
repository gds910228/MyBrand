import { Suspense } from 'react';
import SubscriptionResult from '@/components/SubscriptionResult';

export const metadata = {
  title: '已退订 - MisoTech',
};

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <SubscriptionResult locale="zh" kind="unsubscribe" />
    </Suspense>
  );
}
