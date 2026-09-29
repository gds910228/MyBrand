'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { getAdminSearchAnalyticsMessages, type AdminLocale } from '@/lib/adminMessages';

// /admin/search-analytics 搜索分析视图（feat-search-discovery-20260928，能力块 E）
// - 热门搜索词 + 零结果词两张表，数据来自 /api/admin/search-analytics
// - 鉴权：ADMIN_TOKEN（sessionStorage admin_token，与 /admin/content、/admin/comments 共用）
// - i18n：页内 EN/中文 切换（getAdminSearchAnalyticsMessages，单一来源 i18n/messages）
// - 该页面无 /zh 镜像：与既有 /admin/{comments,content,notify} 惯例一致（站内后台为单语入口，语言页内切换）

interface QueryStat {
  query: string;
  count: number;
  zeroResultCount?: number;
}

interface AnalyticsResp {
  ok: boolean;
  totalSearches?: number;
  uniqueQueries?: number;
  storage?: string;
  sampledEvents?: number;
  topQueries?: QueryStat[];
  zeroResultQueries?: QueryStat[];
  error?: string;
}

const TOKEN_KEY = 'admin_token';

export default function AdminSearchAnalyticsPage() {
  const [locale, setLocale] = useState<AdminLocale>('en');
  const [token, setToken] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<AnalyticsResp | null>(null);

  const t = getAdminSearchAnalyticsMessages(locale);

  const load = useCallback(
    async (authToken: string) => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/admin/search-analytics', {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
          cache: 'no-store',
        });
        const json = (await res.json()) as AnalyticsResp;
        if (!res.ok || !json.ok) {
          setError(json.error || `HTTP ${res.status}`);
          if (res.status === 401 || res.status === 403) {
            setLoggedIn(false);
            sessionStorage.removeItem(TOKEN_KEY);
          }
          return;
        }
        setData(json);
        setLoggedIn(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // 恢复已保存的 token（与 /admin/comments 相同行为）
  useEffect(() => {
    const saved = sessionStorage.getItem(TOKEN_KEY);
    if (saved) {
      setToken(saved);
      void load(saved);
    }
  }, [load]);

  const onLogin = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem(TOKEN_KEY, token);
    void load(token);
  };

  const onLogout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken('');
    setLoggedIn(false);
    setData(null);
  };

  const topQueries = data?.topQueries || [];
  const zeroQueries = data?.zeroResultQueries || [];

  return (
    <div className="min-h-screen bg-neutral-light dark:bg-dark-bg-primary py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* 头部 */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-neutral-darker dark:text-dark-neutral-darker">
              {t.title}
            </h1>
            <p className="text-sm text-neutral-dark dark:text-dark-neutral-dark mt-1">
              {t.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')}
              className="px-3 py-1.5 text-sm rounded-lg border border-neutral-light dark:border-dark-neutral-light"
            >
              {locale === 'en' ? t.langZh : t.langEn}
            </button>
            {loggedIn && (
              <>
                <button
                  type="button"
                  onClick={() => void load(token)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-neutral-light dark:border-dark-neutral-light"
                >
                  {t.refresh}
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-3 py-1.5 text-sm rounded-lg border border-neutral-light dark:border-dark-neutral-light"
                >
                  {t.logout}
                </button>
              </>
            )}
          </div>
        </div>

        {/* 登录 */}
        {!loggedIn ? (
          <form
            onSubmit={onLogin}
            className="max-w-sm p-6 rounded-xl glass-surface border border-white/20 dark:border-white/10"
          >
            <h2 className="font-semibold mb-4 text-neutral-darker dark:text-dark-neutral-darker">
              {t.loginTitle}
            </h2>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={t.passwordPlaceholder}
              className="w-full px-4 py-2 rounded-lg border border-neutral-light dark:border-dark-neutral-light bg-transparent mb-4"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-50"
            >
              {t.login}
            </button>
            {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
          </form>
        ) : (
          <>
            {/* 总览 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StatCard label={t.totalSearches} value={data?.totalSearches ?? 0} />
              <StatCard label={t.uniqueQueries} value={data?.uniqueQueries ?? 0} />
              <StatCard label={t.zeroResultQueries} value={zeroQueries.length} />
            </div>

            {error && (
              <p className="mb-6 text-sm text-red-600 dark:text-red-400">
                {t.loadFailed}: {error}
              </p>
            )}

            {/* 热门词 */}
            <Section title={t.topQueriesTitle}>
              {topQueries.length === 0 ? (
                <Empty text={loading ? t.loading : t.empty} />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-neutral-dark dark:text-dark-neutral-dark border-b border-neutral-light dark:border-dark-neutral-light">
                      <th className="py-2">{t.colQuery}</th>
                      <th className="py-2 text-right">{t.colCount}</th>
                      <th className="py-2 text-right">{t.colZeroCount}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topQueries.map((q) => (
                      <tr
                        key={q.query}
                        className="border-b border-neutral-light/50 dark:border-dark-neutral-light/30"
                      >
                        <td className="py-2 text-neutral-darker dark:text-dark-neutral-darker">
                          {q.query}
                        </td>
                        <td className="py-2 text-right">{q.count}</td>
                        <td className="py-2 text-right">{q.zeroResultCount ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>

            {/* 零结果词 */}
            <Section title={t.zeroResultTitle}>
              {zeroQueries.length === 0 ? (
                <Empty text={loading ? t.loading : t.emptyZero} />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-neutral-dark dark:text-dark-neutral-dark border-b border-neutral-light dark:border-dark-neutral-light">
                      <th className="py-2">{t.colQuery}</th>
                      <th className="py-2 text-right">{t.colZeroCount}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zeroQueries.map((q) => (
                      <tr
                        key={q.query}
                        className="border-b border-neutral-light/50 dark:border-dark-neutral-light/30"
                      >
                        <td className="py-2 text-neutral-darker dark:text-dark-neutral-darker">
                          {q.query}
                        </td>
                        <td className="py-2 text-right">{q.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>

            <div className="mt-8 space-y-2 text-xs text-neutral-dark/70 dark:text-dark-neutral-dark/70">
              <p>{t.storageNote}</p>
              <p>{t.privacyNote}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-4 rounded-xl glass-surface border border-white/20 dark:border-white/10">
      <p className="text-xs text-neutral-dark dark:text-dark-neutral-dark">{label}</p>
      <p className="text-2xl font-bold text-neutral-darker dark:text-dark-neutral-darker mt-1">
        {value}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-3 text-neutral-darker dark:text-dark-neutral-darker">
        {title}
      </h2>
      <div className="p-4 rounded-xl glass-surface border border-white/20 dark:border-white/10 overflow-x-auto">
        {children}
      </div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="py-6 text-center text-sm text-neutral-dark/60 dark:text-dark-neutral-dark/60">
      {text}
    </p>
  );
}
