'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getSubscribeMessages } from '@/lib/subscribeMessages';

// 是否配置了 VAPID 公钥（决定是否处于演示模式）
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

const PushSubscribeButton: React.FC = () => {
  const pathname = usePathname();
  const locale = pathname.startsWith('/zh') ? 'zh' : 'en';
  const t = getSubscribeMessages(locale).push;

  const [supported, setSupported] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const ok = typeof window !== 'undefined'
      && 'serviceWorker' in navigator
      && 'PushManager' in window;
    setSupported(ok);
    if (ok) {
      // 检查是否已订阅
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => setSubscribed(!!sub))
        .catch(() => {});
    }
  }, []);

  const handleSubscribe = async () => {
    if (!supported) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'denied') {
        setStatus('error');
        setErrorMsg(t.permissionDenied);
        return;
      }
      if (perm !== 'granted') return;

      // 注册 SW（已注册会复用）
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON(), locale }),
      });
      if (!res.ok) throw new Error('register failed');

      setSubscribed(true);
      setStatus('idle');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message || 'error');
    }
  };

  const handleUnsubscribe = async () => {
    setStatus('loading');
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      setSubscribed(false);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  };

  if (!supported) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">{t.unsupported}</p>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={subscribed ? handleUnsubscribe : handleSubscribe}
        disabled={status === 'loading'}
        className="px-5 py-2.5 rounded-lg border border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'loading'
          ? '...'
          : subscribed
            ? t.unsubscribeButton
            : t.subscribeButton}
      </button>
      {status === 'error' && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
      )}
      {subscribed && status === 'idle' && (
        <p className="mt-2 text-sm text-green-600 dark:text-green-400">{t.enabled}</p>
      )}
    </div>
  );
};

// VAPID 公钥 base64url -> Uint8Array（pushManager.subscribe 需要）
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = typeof window !== 'undefined'
    ? window.atob(base64)
    : Buffer.from(base64, 'base64').toString('binary');
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export default PushSubscribeButton;
