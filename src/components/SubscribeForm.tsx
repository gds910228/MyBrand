'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { getSubscribeMessages } from '@/lib/subscribeMessages';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SubscribeForm: React.FC = () => {
  const pathname = usePathname();
  const locale = pathname.startsWith('/zh') ? 'zh' : 'en';
  const t = getSubscribeMessages(locale);

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !EMAIL_RE.test(trimmed)) {
      setStatus('error');
      setErrorMsg(t.invalidEmail);
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, locale }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'request failed');
      }
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
      setErrorMsg(t.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.emailPlaceholder}
          aria-label={t.emailPlaceholder}
          disabled={status === 'loading'}
          className="flex-1 px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          required
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {status === 'loading' ? t.subscribing : t.subscribeButton}
        </button>
      </div>
      {status === 'success' && (
        <p className="mt-3 text-sm text-green-600 dark:text-green-400">{t.success}</p>
      )}
      {status === 'error' && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
      )}
    </form>
  );
};

export default SubscribeForm;
