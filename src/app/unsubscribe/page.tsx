import { Suspense } from 'react';
import SubscriptionResult from '@/components/SubscriptionResult';

export const metadata = {
  title: 'Unsubscribed - MisoTech',
};

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <SubscriptionResult locale="en" kind="unsubscribe" />
    </Suspense>
  );
}
