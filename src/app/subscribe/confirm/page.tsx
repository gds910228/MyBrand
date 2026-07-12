import { Suspense } from 'react';
import SubscriptionResult from '@/components/SubscriptionResult';

export const metadata = {
  title: 'Subscription Confirmed - MisoTech',
};

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <SubscriptionResult locale="en" kind="confirm" />
    </Suspense>
  );
}
