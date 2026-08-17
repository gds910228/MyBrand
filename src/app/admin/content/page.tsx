'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getAdminMessages, type AdminLocale } from '@/lib/adminMessages';

// /admin/content 内容管理后台(feat-content-state-machine)
// - 全状态文章列表(draft/scheduled/published)+ 状态流转 + 定时设置 + 预览链接 + 手动发布到期
// - 鉴权:ADMIN_TOKEN(sessionStorage 保存,随 Authorization: Bearer 头发送);
//   未配置时服务端仅放行 localhost(本页任意密码可进,由 API 兜底鉴权)。
// - i18n:页内 EN/中文 切换(getAdminMessages,单一来源 i18n/messages);深色 dark: 变体;移动端卡片布局。

interface AdminPost {
  id: string;
  slug: string;
  title: string;
  status: 'draft' | 'scheduled' | 'published';
  scheduledAt: string | null;
  createdAt: string;
  date: string;
  language?: string;
  previewUrl: string;
}

interface PublishDueResult {
  ok: boolean;
  processed: number;
  failed: number;
  skipped: number;
  details?: { id: string; slug?: string; result?: string; error?: string }[];
}

const STATUS_BADGE: Record<AdminPost['status'], string> = {
  draft: 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300',
  scheduled: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
  published: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
};

/** ISO → datetime-local 输入值(本地时区 yyyy-MM-ddTHH:mm) */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminContentPage() {
  const [locale, setLocale] = useState<AdminLocale>('en');
  const [token, setToken] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [actionError, setActionError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [scheduleInput, setScheduleInput] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishDueResult | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const t = useMemo(() => getAdminMessages(locale), [locale]);

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

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setListError('');
    try {
      const res = await fetch('/api/admin/content', { headers: authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setPosts(data.posts || []);
    } catch (err: any) {
      setListError(err?.message || t.loadFailed);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authHeaders]);

  useEffect(() => {
    if (loggedIn) loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem('admin_token', token);
    setLoggedIn(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    setToken('');
    setLoggedIn(false);
    setPosts([]);
  };

  const changeStatus = async (post: AdminPost, status: AdminPost['status']) => {
    setBusyId(post.id);
    setActionError('');
    try {
      const res = await fetch('/api/admin/content/status', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: post.id, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      await loadPosts();
    } catch (err: any) {
      setActionError(err?.message || t.actionFailed);
    } finally {
      setBusyId(null);
    }
  };

  const saveSchedule = async (post: AdminPost, clear = false) => {
    setBusyId(post.id);
    setActionError('');
    try {
      const scheduledAt = clear ? null : new Date(scheduleInput).toISOString();
      const res = await fetch('/api/admin/content/schedule', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: post.id, scheduledAt }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.error === 'scheduledAt-field-missing' ? t.scheduledMissingHint : data.error || `HTTP ${res.status}`,
        );
      }
      setEditingScheduleId(null);
      await loadPosts();
    } catch (err: any) {
      setActionError(err?.message || t.actionFailed);
    } finally {
      setBusyId(null);
    }
  };

  const copyPreview = async (post: AdminPost) => {
    try {
      await navigator.clipboard.writeText(post.previewUrl);
      setCopiedId(post.id);
      setTimeout(() => setCopiedId((cur) => (cur === post.id ? null : cur)), 2000);
    } catch {
      // 剪贴板不可用时退化为弹窗展示
      window.prompt(t.copyPreview, post.previewUrl);
    }
  };

  const runPublishDue = async () => {
    setPublishing(true);
    setPublishResult(null);
    setActionError('');
    try {
      const res = await fetch('/api/admin/content/publish-due', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setPublishResult(data);
      await loadPosts();
    } catch (err: any) {
      setActionError(err?.message || t.actionFailed);
    } finally {
      setPublishing(false);
    }
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
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">{t.subtitle}</p>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={runPublishDue}
          disabled={publishing}
          className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {publishing ? t.publishDueRunning : t.publishDue}
        </button>
        <button onClick={loadPosts} className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800">
          {t.refresh}
        </button>
      </div>

      {publishResult && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          {t.publishDueResult
            .replace('{processed}', String(publishResult.processed))
            .replace('{failed}', String(publishResult.failed))
            .replace('{skipped}', String(publishResult.skipped))}
        </p>
      )}
      {actionError && <p className="text-sm text-red-600 dark:text-red-400 mb-4">{actionError}</p>}
      {listError && <p className="text-sm text-red-600 dark:text-red-400 mb-4">{listError}</p>}

      {loading ? (
        <p className="text-neutral-500">{t.loading}</p>
      ) : posts.length === 0 ? (
        <p className="text-neutral-500 text-center py-8">{t.empty}</p>
      ) : (
        <>
          {/* 桌面表格 */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-300">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">{t.colTitle}</th>
                  <th className="text-left px-4 py-3 font-medium">{t.colStatus}</th>
                  <th className="text-left px-4 py-3 font-medium">{t.colScheduledAt}</th>
                  <th className="text-left px-4 py-3 font-medium">{t.colCreatedAt}</th>
                  <th className="text-left px-4 py-3 font-medium">{t.colLanguage}</th>
                  <th className="text-left px-4 py-3 font-medium">{t.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700 bg-white dark:bg-neutral-800/30">
                {posts.map((post) => (
                  <tr key={post.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutral-900 dark:text-neutral-100 max-w-xs truncate">{post.title}</div>
                      <div className="text-xs text-neutral-500 truncate">slug: {post.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[post.status]}`}>
                        {t.status[post.status]}
                      </span>
                      {post.status === 'scheduled' && !post.scheduledAt && (
                        <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">{t.notScheduledHint}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                      {editingScheduleId === post.id ? (
                        <span className="flex items-center gap-2">
                          <input
                            type="datetime-local"
                            value={scheduleInput}
                            onChange={(e) => setScheduleInput(e.target.value)}
                            className={inputCls}
                          />
                          <button onClick={() => saveSchedule(post)} disabled={busyId === post.id || !scheduleInput} className="text-blue-600 dark:text-blue-400 text-xs hover:underline disabled:opacity-50">
                            {t.saveSchedule}
                          </button>
                          <button onClick={() => setEditingScheduleId(null)} className="text-neutral-500 text-xs hover:underline">
                            {t.cancel}
                          </button>
                        </span>
                      ) : (
                        post.scheduledAt ? new Date(post.scheduledAt).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US') : '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                      {post.createdAt?.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                      {post.language === 'Chinese' ? t.hasZh : post.language === 'English' ? t.hasEn : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={post.status}
                          disabled={busyId === post.id}
                          onChange={(e) => changeStatus(post, e.target.value as AdminPost['status'])}
                          className={inputCls}
                          aria-label={t.setStatus}
                        >
                          <option value="draft">{t.status.draft}</option>
                          <option value="scheduled">{t.status.scheduled}</option>
                          <option value="published">{t.status.published}</option>
                        </select>
                        <button
                          onClick={() => {
                            setEditingScheduleId(post.id);
                            setScheduleInput(toLocalInput(post.scheduledAt));
                          }}
                          className="text-blue-600 dark:text-blue-400 text-xs hover:underline"
                        >
                          {t.setSchedule}
                        </button>
                        {post.scheduledAt && (
                          <button onClick={() => saveSchedule(post, true)} disabled={busyId === post.id} className="text-red-600 dark:text-red-400 text-xs hover:underline disabled:opacity-50">
                            {t.clearSchedule}
                          </button>
                        )}
                        <button onClick={() => copyPreview(post)} className="text-neutral-600 dark:text-neutral-300 text-xs hover:underline">
                          {copiedId === post.id ? t.copied : t.copyPreview}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 移动端卡片 */}
          <ul className="md:hidden space-y-3">
            {posts.map((post) => (
              <li key={post.id} className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[post.status]}`}>
                    {t.status[post.status]}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {post.language === 'Chinese' ? t.hasZh : post.language === 'English' ? t.hasEn : '—'}
                  </span>
                </div>
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100">{post.title}</h3>
                <p className="text-xs text-neutral-500 mt-1">
                  slug: {post.slug} · {t.colCreatedAt}: {post.createdAt?.slice(0, 10)}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {t.colScheduledAt}: {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US') : '—'}
                </p>
                {post.status === 'scheduled' && !post.scheduledAt && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{t.notScheduledHint}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <select
                    value={post.status}
                    disabled={busyId === post.id}
                    onChange={(e) => changeStatus(post, e.target.value as AdminPost['status'])}
                    className={inputCls}
                    aria-label={t.setStatus}
                  >
                    <option value="draft">{t.status.draft}</option>
                    <option value="scheduled">{t.status.scheduled}</option>
                    <option value="published">{t.status.published}</option>
                  </select>
                  <button
                    onClick={() => {
                      setEditingScheduleId(editingScheduleId === post.id ? null : post.id);
                      setScheduleInput(toLocalInput(post.scheduledAt));
                    }}
                    className="text-blue-600 dark:text-blue-400 text-xs hover:underline"
                  >
                    {t.setSchedule}
                  </button>
                  {post.scheduledAt && (
                    <button onClick={() => saveSchedule(post, true)} disabled={busyId === post.id} className="text-red-600 dark:text-red-400 text-xs hover:underline disabled:opacity-50">
                      {t.clearSchedule}
                    </button>
                  )}
                  <button onClick={() => copyPreview(post)} className="text-neutral-600 dark:text-neutral-300 text-xs hover:underline">
                    {copiedId === post.id ? t.copied : t.copyPreview}
                  </button>
                </div>
                {editingScheduleId === post.id && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="datetime-local"
                      value={scheduleInput}
                      onChange={(e) => setScheduleInput(e.target.value)}
                      className={inputCls}
                    />
                    <button onClick={() => saveSchedule(post)} disabled={busyId === post.id || !scheduleInput} className="text-blue-600 dark:text-blue-400 text-xs hover:underline disabled:opacity-50">
                      {t.saveSchedule}
                    </button>
                    <button onClick={() => setEditingScheduleId(null)} className="text-neutral-500 text-xs hover:underline">
                      {t.cancel}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
