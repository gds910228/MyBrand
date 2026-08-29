'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getAdminCommentsMessages, type AdminLocale } from '@/lib/adminMessages';

// /admin/comments 评论审核工作台（feat-comment-moderation-20260828）
// - 全量评论列表（pending/spam/approved 三态筛选 + 待审/垃圾计数徽标），显示评分与命中原因
// - 鉴权：ADMIN_TOKEN（sessionStorage admin_token，与 /admin/content 共用；未配置时服务端仅放行 localhost）
// - i18n：页内 EN/中文 切换（getAdminCommentsMessages，单一来源 i18n/messages）；深色 dark: 变体；移动端卡片布局

type Tab = 'all' | 'pending' | 'spam' | 'approved';

interface AdminCommentItem {
  id: string;
  postId: string;
  parentId: string | null;
  author: { name: string; email: string; avatar?: string | null };
  content: string;
  createdAt: string;
  status: 'pending' | 'spam' | 'approved';
  spamScore: number | null;
  spamReasons: string[];
}

interface AdminCommentListResp {
  items: AdminCommentItem[];
  counts: { pending: number; spam: number; approved: number; total: number };
  capped: boolean;
  countsCapped?: boolean;
}

const STATUS_BADGE: Record<AdminCommentItem['status'], string> = {
  pending: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
  spam: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
  approved: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
};

const TABS: Tab[] = ['all', 'pending', 'spam', 'approved'];

export default function AdminCommentsPage() {
  const [locale, setLocale] = useState<AdminLocale>('en');
  const [token, setToken] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [tab, setTab] = useState<Tab>('pending');
  const [items, setItems] = useState<AdminCommentItem[]>([]);
  const [counts, setCounts] = useState({ pending: 0, spam: 0, approved: 0, total: 0 });
  const [capped, setCapped] = useState(false);
  const [countsCapped, setCountsCapped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const t = useMemo(() => getAdminCommentsMessages(locale), [locale]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedToken = sessionStorage.getItem('admin_token');
    const savedLocale = localStorage.getItem('admin_locale');
    if (savedLocale === 'en' || savedLocale === 'zh') setLocale(savedLocale);
    if (savedToken !== null) {
      setToken(savedToken);
      setLoggedIn(true);
    }
  }, []);

  const switchLocale = (next: AdminLocale) => {
    setLocale(next);
    localStorage.setItem('admin_locale', next);
  };

  const authHeaders = useCallback(
    () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }),
    [token],
  );

  const loadComments = useCallback(
    async (targetTab: Tab) => {
      setLoading(true);
      setListError('');
      try {
        const res = await fetch(`/api/admin/comments?status=${targetTab}&limit=100`, {
          headers: authHeaders(),
        });
        const data = (await res.json().catch(() => ({}))) as Partial<AdminCommentListResp> & { error?: string };
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        setItems(data.items || []);
        setCounts(data.counts || { pending: 0, spam: 0, approved: 0, total: 0 });
        setCapped(!!data.capped);
        setCountsCapped(!!data.countsCapped);
      } catch (err: any) {
        setListError(err?.message || t.loadFailed);
      } finally {
        setLoading(false);
      }
    },
    [authHeaders, t.loadFailed],
  );

  useEffect(() => {
    if (loggedIn) loadComments(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn, tab]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem('admin_token', token);
    setLoggedIn(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    setToken('');
    setLoggedIn(false);
    setItems([]);
  };

  const changeStatus = async (comment: AdminCommentItem, status: AdminCommentItem['status']) => {
    setBusyId(comment.id);
    setActionError('');
    try {
      const res = await fetch('/api/admin/comments/status', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: comment.id, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.code === 'moderation-field-missing') throw new Error(t.fieldMissingHint);
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      await loadComments(tab);
    } catch (err: any) {
      setActionError(err?.message || t.actionFailed);
    } finally {
      setBusyId(null);
    }
  };

  // reason 码 → i18n 标签（剥离冒号后缀，未知码回落显式原值）
  const reasonLabel = (code: string): string => {
    const key = code.split(':')[0] as keyof typeof t.reasonLabels;
    return t.reasonLabels[key] || code;
  };

  const tabBadge = (tb: Tab): string => {
    const n =
      tb === 'pending' ? counts.pending : tb === 'spam' ? counts.spam : tb === 'approved' ? counts.approved : counts.total;
    // 计数触达 100 上限时追加 + 号（如 100+）
    return countsCapped ? `${n}${t.countsCappedSuffix}` : String(n);
  };

  const inputCls =
    'px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';

  if (!loggedIn) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4 py-20">
        <form onSubmit={handleLogin} className="max-w-sm w-full">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-6 text-center">
            {t.loginTitle}
          </h1>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={t.passwordPlaceholder}
            className={`w-full ${inputCls}`}
            autoFocus
          />
          <button
            type="submit"
            className="w-full mt-4 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            {t.login}
          </button>
          <div className="mt-4 flex justify-center gap-2 text-sm">
            <button type="button" onClick={() => switchLocale('en')} className={locale === 'en' ? 'font-bold text-blue-600' : 'text-neutral-500'}>
              {t.langEn}
            </button>
            <span className="text-neutral-400">/</span>
            <button type="button" onClick={() => switchLocale('zh')} className={locale === 'zh' ? 'font-bold text-blue-600' : 'text-neutral-500'}>
              {t.langZh}
            </button>
          </div>
        </form>
      </main>
    );
  }

  const renderActions = (c: AdminCommentItem) => (
    <div className="flex flex-wrap items-center gap-2">
      {c.status !== 'approved' && (
        <button
          onClick={() => changeStatus(c, 'approved')}
          disabled={busyId === c.id}
          className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
        >
          {t.actions.approve}
        </button>
      )}
      {c.status !== 'spam' && (
        <button
          onClick={() => changeStatus(c, 'spam')}
          disabled={busyId === c.id}
          className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
        >
          {t.actions.markSpam}
        </button>
      )}
      {c.status !== 'pending' && (
        <button
          onClick={() => changeStatus(c, 'pending')}
          disabled={busyId === c.id}
          className="px-3 py-1.5 rounded-lg border border-amber-400 text-amber-700 dark:text-amber-400 text-xs font-medium hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50"
        >
          {t.actions.toPending}
        </button>
      )}
    </div>
  );

  const renderMeta = (c: AdminCommentItem) => (
    <div className="text-xs text-neutral-500 dark:text-neutral-400 space-y-0.5">
      <div>
        {t.colScore}: <span className="font-mono">{c.spamScore ?? '—'}</span>
        {c.spamReasons.length > 0 && (
          <span className="ml-2">
            {c.spamReasons.map((r) => (
              <span key={r} className="inline-block mr-1 px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700/60">
                {reasonLabel(r)}
              </span>
            ))}
          </span>
        )}
      </div>
      <div>
        {t.slugLabel}: {c.postId}
        {c.parentId ? ` · ${t.replyToLabel}: ${c.parentId.slice(0, 8)}` : ''}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen px-4 py-10 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t.title}</h1>
        <div className="flex items-center gap-3 text-sm">
          <button onClick={() => switchLocale(locale === 'en' ? 'zh' : 'en')} className="text-blue-600 dark:text-blue-400 hover:underline">
            {locale === 'en' ? t.langZh : t.langEn}
          </button>
          <button onClick={handleLogout} className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
            {t.logout}
          </button>
        </div>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">{t.subtitle}</p>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        {TABS.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === tb
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            {t.tabs[tb]}
            <span className="ml-1.5 text-xs opacity-80">({tabBadge(tb)})</span>
          </button>
        ))}
        <button
          onClick={() => loadComments(tab)}
          className="ml-auto px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          {t.refresh}
        </button>
      </div>

      {capped && <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">{t.cappedNote.replace('{limit}', '100')}</p>}
      {actionError && <p className="text-sm text-red-600 dark:text-red-400 mb-3">{actionError}</p>}
      {listError && <p className="text-sm text-red-600 dark:text-red-400 mb-3">{listError}</p>}

      {loading ? (
        <p className="text-neutral-500">{t.loading}</p>
      ) : items.length === 0 ? (
        <p className="text-neutral-500 text-center py-8">{t.empty}</p>
      ) : (
        <>
          {/* 桌面表格 */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-300">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">{t.colContent}</th>
                  <th className="text-left px-4 py-3 font-medium">{t.colAuthor}</th>
                  <th className="text-left px-4 py-3 font-medium">{t.colStatus}</th>
                  <th className="text-left px-4 py-3 font-medium">{t.colCreatedAt}</th>
                  <th className="text-left px-4 py-3 font-medium">{t.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700 bg-white dark:bg-neutral-800/30">
                {items.map((c) => (
                  <tr key={c.id} className="align-top">
                    <td className="px-4 py-3 max-w-sm">
                      <p className="text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap break-words line-clamp-4">{c.content}</p>
                      <div className="mt-2">{renderMeta(c)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">{c.author.name}</div>
                      <div className="text-xs text-neutral-500">{c.author.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[c.status]}`}>
                        {t.status[c.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                      {c.createdAt?.slice(0, 16).replace('T', ' ')}
                    </td>
                    <td className="px-4 py-3">{renderActions(c)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 移动端卡片 */}
          <ul className="md:hidden space-y-3">
            {items.map((c) => (
              <li key={c.id} className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[c.status]}`}>{t.status[c.status]}</span>
                  <span className="text-xs text-neutral-500">{c.createdAt?.slice(0, 10)}</span>
                </div>
                <p className="text-sm text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap break-words">{c.content}</p>
                <p className="text-xs text-neutral-500 mt-2">
                  {c.author.name} · {c.author.email}
                </p>
                <div className="mt-2">{renderMeta(c)}</div>
                <div className="mt-3">{renderActions(c)}</div>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
