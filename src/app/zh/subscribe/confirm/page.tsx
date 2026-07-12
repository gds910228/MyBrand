import { Suspense } from 'react';
import SubscriptionResult from '@/components/SubscriptionResult';

export const metadata = {
  title: '订阅已确认 - MisoTech',
};

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <SubscriptionResult locale="zh" kind="confirm" />
    </Suspense>
  );
}
