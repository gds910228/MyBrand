'use client';

import React, { useState, useEffect } from 'react';

interface PostItem {
  slug: string;
  titleEn: string;
  titleZh: string;
  hasEn: boolean;
  hasZh: boolean;
  date: string;
}

interface NotifyResult {
  ok: boolean;
  slug?: string;
  push: { pushOk: number; pushFail: number; pushSkipped: number };
  email: { ok: number; fail: number; skipped: number };
  error?: string;
}

export default function AdminNotifyPage() {
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState('');
  // 每篇文章的发送状态: slug -> { loading, result, error }
  const [sending, setSending] = useState<Record<string, { loading: boolean; result?: NotifyResult; error?: string }>>({});
  // 本次会话已通知的 slug
  const [notified, setNotified] = useState<Set<string>>(new Set());

  // 从 sessionStorage 恢复密码
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem('admin_password') : '';
    if (saved) {
      setPassword(saved);
      setLoggedIn(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    sessionStorage.setItem('admin_password', password);
    setLoggedIn(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_password');
    setPassword('');
    setLoggedIn(false);
    setPosts([]);
    setNotified(new Set());
  };

  const loadPosts = async () => {
    setLoadingList(true);
    setListError('');
    try {
      const res = await fetch(`/api/admin/posts?password=${encodeURIComponent(password)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err: any) {
      setListError(err?.message || '加载失败');
    } finally {
      setLoadingList(false);
    }
  };

  // 登录后自动加载文章列表
  useEffect(() => {
    if (loggedIn && posts.length === 0) {
      loadPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  const handleNotify = async (slug: string) => {
    setSending((s) => ({ ...s, [slug]: { loading: true } }));
    try {
      const res = await fetch('/api/admin/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setSending((s) => ({ ...s, [slug]: { loading: false, result: data } }));
      setNotified((set) => new Set(set).add(slug));
    } catch (err: any) {
      setSending((s) => ({ ...s, [slug]: { loading: false, error: err?.message || '发送失败' } }));
    }
  };

  if (!loggedIn) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4 py-20">
        <form onSubmit={handleLogin} className="max-w-sm w-full">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-6 text-center">
            管理后台
          </h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="管理密码"
            className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            type="submit"
            className="w-full mt-4 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            登录
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          新文章通知管理
        </h1>
        <button
          onClick={handleLogout}
          className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
        >
          退出
        </button>
      </div>

      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
        点击文章旁的「通知订阅者」按钮，给所有已订阅用户发送新文章邮件 + Web Push 通知。
      </p>

      {listError && (
        <p className="text-sm text-red-600 dark:text-red-400 mb-4">{listError}</p>
      )}

      {loadingList ? (
        <p className="text-neutral-500">加载文章列表...</p>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => {
            const state = sending[post.slug];
            const isNotified = notified.has(post.slug);
            return (
              <li
                key={post.slug}
                className="flex items-start justify-between gap-4 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                      {post.hasEn && post.hasZh ? '中英' : post.hasZh ? '中' : '英'}
                    </span>
                    {isNotified && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        已通知
                      </span>
                    )}
                  </div>
                  {post.hasZh && (
                    <h3 className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      {post.titleZh}
                    </h3>
                  )}
                  {post.hasEn && (
                    <h3 className={`text-sm text-neutral-600 dark:text-neutral-400 truncate ${post.hasZh ? 'mt-0.5' : 'font-medium text-neutral-900 dark:text-neutral-100'}`}>
                      {post.titleEn}
                    </h3>
                  )}
                  <p className="text-xs text-neutral-500 mt-1">
                    {post.date?.slice(0, 10)} · slug: {post.slug}
                  </p>
                  {state?.result && (
                    <p className="text-xs text-neutral-500 mt-2">
                      邮件: 成功 {state.result.email.ok} / 失败 {state.result.email.fail}
                      {state.result.email.skipped > 0 && ` / 跳过 ${state.result.email.skipped}`}
                      {' · '}推送: 成功 {state.result.push.pushOk} / 失败 {state.result.push.pushFail}
                    </p>
                  )}
                  {state?.error && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">{state.error}</p>
                  )}
                </div>
                <button
                  onClick={() => handleNotify(post.slug)}
                  disabled={state?.loading}
                  className="shrink-0 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {state?.loading ? '发送中...' : '通知订阅者'}
                </button>
              </li>
            );
          })}
          {posts.length === 0 && !loadingList && (
            <li className="text-neutral-500 text-center py-8">暂无已发布文章</li>
          )}
        </ul>
      )}

      <button
        onClick={loadPosts}
        className="mt-6 text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        刷新文章列表
      </button>
    </main>
  );
}
