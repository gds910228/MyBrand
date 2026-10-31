'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAdminPublishMessages, type AdminLocale } from '@/lib/adminMessages';

// /admin/publish 发布工作台(feat-publish-pipeline)
// - 粘贴/导入 Obsidian Markdown → 解析 → AI 三件套(字段+封面提示词+推文) → 发布到 Notion
// - 鉴权与 /admin/content 相同:ADMIN_TOKEN(sessionStorage),未配置时服务端仅放行 localhost
// - 图片:与 md 一起多选上传,按文件名与正文引用匹配,发布时统一传图床
// - 发布走 /api/admin/publish(表单字段为最终覆盖),AI 在 /api/admin/publish/parse 完成

interface ParsedImage {
  ref: string;
  alt: string;
  external: boolean;
  hotlinkProtected: boolean;
}

interface AiTrio {
  fields: Record<string, any>;
  coverPrompts: string[];
  tweet: string;
}

interface ParseResponse {
  fields: Fields;
  images: ParsedImage[];
  coverRef: string | null;
  warnings: string[];
  ai: AiTrio | null;
  bodyLength: number;
}

interface Fields {
  title: string;
  slug: string;
  language: 'Chinese' | 'English';
  status: 'draft' | 'scheduled' | 'published';
  publishDate: string;
  scheduledAt: string;
  summary: string;
  tags: string;
  cover: string;
  // 评测扩展(字符串表单值;发布时 ratings 空串→跳过,pros/cons 按行拆,对比表 JSON.parse)
  ratingOverall: string;
  ratingEaseOfUse: string;
  ratingFeatures: string;
  pros: string;
  cons: string;
  toolWebsite: string;
  toolPricing: string;
  comparisonColumns: string;
  comparisonData: string;
}

interface PublishResult {
  slug: string;
  language: string;
  title: string;
  status: string;
  notionUrl: string | null;
  previewUrl: string | null;
  created: boolean;
  blockCount: number;
  images: { total: number; uploaded: number; skipped: number; missing: string[] };
  warnings: string[];
  ai: AiTrio | null;
}

const EMPTY_FIELDS: Fields = {
  title: '',
  slug: '',
  language: 'Chinese',
  status: 'draft',
  publishDate: new Date().toISOString().slice(0, 10),
  scheduledAt: '',
  summary: '',
  tags: '',
  cover: '',
  ratingOverall: '',
  ratingEaseOfUse: '',
  ratingFeatures: '',
  pros: '',
  cons: '',
  toolWebsite: '',
  toolPricing: '',
  comparisonColumns: '',
  comparisonData: '',
};

/** 与服务端 matchImageBuffer 相同的文件名匹配逻辑(精确/相对/文件名/无扩展名 stem)。 */
function fileMatchesRefs(fileName: string, refs: string[]): boolean {
  for (const ref of refs) {
    if (ref === fileName) return true;
    const refBase = ref.split('/').pop() || ref;
    if (refBase === fileName) return true;
    const stem = fileName.replace(/\.[^.]+$/, '');
    const refStem = refBase.replace(/\.[^.]+$/, '');
    if (stem && refStem === stem) return true;
  }
  return false;
}

export default function AdminPublishPage() {
  const [locale, setLocale] = useState<AdminLocale>('en');
  const [token, setToken] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [markdown, setMarkdown] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);
  const [parsed, setParsed] = useState<Omit<ParseResponse, 'fields' | 'ai'> | null>(null);
  const [ai, setAi] = useState<AiTrio | null>(null);
  const [parsing, setParsing] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PublishResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const mdFileRef = useRef<HTMLInputElement>(null);
  const imgFileRef = useRef<HTMLInputElement>(null);

  const t = useMemo(() => getAdminPublishMessages(locale), [locale]);

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem('admin_token', token);
    setLoggedIn(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    setToken('');
    setLoggedIn(false);
  };

  const importMdFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    setMarkdown(text);
  };

  const handleParse = async () => {
    if (!markdown.trim()) {
      setError(t.needMarkdown);
      return;
    }
    setParsing(true);
    setError('');
    try {
      const res = await fetch('/api/admin/publish/parse', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ markdown }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const payload = data as ParseResponse;
      setFields((cur) => ({ ...payload.fields, status: cur.status || payload.fields.status }));
      setAi(payload.ai);
      const { fields: _f, ai: _a, ...rest } = payload;
      setParsed(rest);
    } catch (err: any) {
      setError(`${t.parseFailed}: ${err?.message || err}`);
    } finally {
      setParsing(false);
    }
  };

  const handleAi = async () => {
    if (!markdown.trim()) {
      setError(t.needMarkdown);
      return;
    }
    setAiBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/publish/parse', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ markdown, generateAi: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const payload = data as ParseResponse;
      // AI 只回填空字段,不覆盖用户已编辑的内容
      setFields((cur) => ({
        ...cur,
        title: cur.title || payload.fields.title,
        slug: cur.slug || payload.fields.slug,
        summary: cur.summary || payload.fields.summary,
        tags: cur.tags || payload.fields.tags,
        language: cur.language || payload.fields.language,
        ratingOverall: cur.ratingOverall || payload.fields.ratingOverall,
        ratingEaseOfUse: cur.ratingEaseOfUse || payload.fields.ratingEaseOfUse,
        ratingFeatures: cur.ratingFeatures || payload.fields.ratingFeatures,
        pros: cur.pros || payload.fields.pros,
        cons: cur.cons || payload.fields.cons,
        toolWebsite: cur.toolWebsite || payload.fields.toolWebsite,
        toolPricing: cur.toolPricing || payload.fields.toolPricing,
        comparisonColumns: cur.comparisonColumns || payload.fields.comparisonColumns,
        comparisonData: cur.comparisonData || payload.fields.comparisonData,
      }));
      if (payload.ai) setAi(payload.ai);
    } catch (err: any) {
      setError(`${t.parseFailed}: ${err?.message || err}`);
    } finally {
      setAiBusy(false);
    }
  };

  const handlePublish = async () => {
    if (!markdown.trim()) {
      setError(t.needMarkdown);
      return;
    }
    setPublishing(true);
    setError('');
    setResult(null);
    try {
      const filesPayload = await Promise.all(
        imageFiles.map(async (f) => ({ name: f.name, base64: await fileToBase64(f) })),
      );
      const totalBytes = imageFiles.reduce((sum, f) => sum + f.size, 0);
      if (totalBytes > 4 * 1024 * 1024) {
        setError(t.largeBodyHint);
        setPublishing(false);
        return;
      }
      // 对比表 JSON 解析(留空 = 不写;格式错直接拦下)
      let comparisonColumns: unknown;
      let comparisonData: unknown;
      try {
        if (fields.comparisonColumns.trim()) comparisonColumns = JSON.parse(fields.comparisonColumns);
        if (fields.comparisonData.trim()) comparisonData = JSON.parse(fields.comparisonData);
      } catch {
        setError(t.comparisonJsonError);
        setPublishing(false);
        return;
      }
      const res = await fetch('/api/admin/publish', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          markdown,
          fields: { ...fields, comparisonColumns, comparisonData },
          files: filesPayload,
          status: fields.status,
          scheduledAt:
            fields.status === 'scheduled' && fields.scheduledAt
              ? new Date(fields.scheduledAt).toISOString()
              : undefined,
          ai,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data.result);
      if (data.result?.ai && !ai) setAi(data.result.ai);
    } catch (err: any) {
      setError(`${t.publishFailed}: ${err?.message || err}`);
    } finally {
      setPublishing(false);
    }
  };

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((cur) => (cur === key ? null : cur)), 2000);
    } catch {
      window.prompt('', text);
    }
  };

  const inputCls =
    'px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';

  if (!loggedIn) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4 py-20">
        <form onSubmit={handleLogin} className="max-w-sm w-full">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-6 text-center">{t.loginTitle}</h1>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={t.passwordPlaceholder}
            className={`w-full ${inputCls}`}
            autoFocus
          />
          <button type="submit" className="w-full mt-4 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
            {t.login}
          </button>
          <div className="mt-4 flex justify-center gap-2 text-sm">
            <button type="button" onClick={() => switchLocale('en')} className={locale === 'en' ? 'font-bold text-blue-600' : 'text-neutral-500'}>
              EN
            </button>
            <span className="text-neutral-400">/</span>
            <button type="button" onClick={() => switchLocale('zh')} className={locale === 'zh' ? 'font-bold text-blue-600' : 'text-neutral-500'}>
              中文
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
            {locale === 'en' ? '中文' : 'EN'}
          </button>
          <button onClick={handleLogout} className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
            {t.logout}
          </button>
        </div>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">{t.subtitle}</p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 左:Markdown 与图片 */}
        <section>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <label className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{t.mdLabel}</label>
            <button type="button" onClick={() => mdFileRef.current?.click()} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              {t.mdFile}
            </button>
            <input
              ref={mdFileRef}
              type="file"
              accept=".md,.markdown,.txt"
              className="hidden"
              onChange={(e) => importMdFile(e.target.files?.[0])}
            />
          </div>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder={t.mdPlaceholder}
            rows={18}
            className={`w-full font-mono text-xs leading-relaxed ${inputCls}`}
          />
          <p className="text-xs text-neutral-400 mt-1">{t.placeholderHint}</p>
          <div className="mt-3">
            <label className="text-sm font-medium text-neutral-800 dark:text-neutral-200 block mb-1">{t.imagesLabel}</label>
            <input
              ref={imgFileRef}
              type="file"
              accept="image/*"
              multiple
              className="text-sm text-neutral-600 dark:text-neutral-300"
              onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
            />
            {imageFiles.length > 0 && (
              <ul className="text-xs mt-1 space-y-0.5">
                {imageFiles.map((f) => {
                  const localRefs = [
                    ...(parsed?.images.filter((i) => !i.external) || []).map((i) => i.ref),
                    ...(parsed?.coverRef ? [parsed.coverRef] : []),
                  ];
                  const matched = parsed ? fileMatchesRefs(f.name, localRefs) : null;
                  return (
                    <li key={f.name} className={matched === false ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-500'}>
                      {matched === null ? '·' : matched ? '✅' : '⚠️'} {f.name}
                      {matched === false && ` — ${t.fileUnmatched}`}
                    </li>
                  );
                })}
              </ul>
            )}
            {imageFiles.length > 0 && !parsed && (
              <p className="text-xs text-neutral-400 mt-1">{t.parseFirstHint}</p>
            )}
          </div>
          {parsed && parsed.warnings.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">{t.warningsTitle}</p>
              <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 list-disc list-inside">
                {parsed.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          {parsed && parsed.images.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">{t.imagesTitle}</p>
              <ul className="text-xs text-neutral-500 space-y-0.5">
                {parsed.images.map((img) => (
                  <li key={img.ref} className="truncate">
                    {img.hotlinkProtected ? '🚫' : img.external ? '🔗' : '🖼'} {img.ref}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* 右:字段表单 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{t.fieldsTitle}</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleParse}
                disabled={parsing}
                className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
              >
                {parsing ? '...' : t.parse}
              </button>
              <button
                type="button"
                onClick={handleAi}
                disabled={aiBusy}
                className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
              >
                {aiBusy ? t.aiRunning : t.aiGenerate}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="text-xs text-neutral-500">{t.titleField}</span>
              <input value={fields.title} onChange={(e) => setFields({ ...fields, title: e.target.value })} className={`w-full ${inputCls}`} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-neutral-500">{t.slugField}</span>
                <input value={fields.slug} onChange={(e) => setFields({ ...fields, slug: e.target.value })} className={`w-full ${inputCls}`} />
              </label>
              <label className="block">
                <span className="text-xs text-neutral-500">{t.languageField}</span>
                <select value={fields.language} onChange={(e) => setFields({ ...fields, language: e.target.value as Fields['language'] })} className={`w-full ${inputCls}`}>
                  <option value="Chinese">{t.langChinese}</option>
                  <option value="English">{t.langEnglish}</option>
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-neutral-500">{t.statusField}</span>
                <select value={fields.status} onChange={(e) => setFields({ ...fields, status: e.target.value as Fields['status'] })} className={`w-full ${inputCls}`}>
                  <option value="draft">{t.statusDraft}</option>
                  <option value="scheduled">{t.statusScheduled}</option>
                  <option value="published">{t.statusPublished}</option>
                </select>
              </label>
              {fields.status === 'scheduled' ? (
                <label className="block">
                  <span className="text-xs text-neutral-500">{t.scheduledAtField}</span>
                  <input type="datetime-local" value={fields.scheduledAt} onChange={(e) => setFields({ ...fields, scheduledAt: e.target.value })} className={`w-full ${inputCls}`} />
                </label>
              ) : (
                <label className="block">
                  <span className="text-xs text-neutral-500">{t.publishDateField}</span>
                  <input type="date" value={fields.publishDate} onChange={(e) => setFields({ ...fields, publishDate: e.target.value })} className={`w-full ${inputCls}`} />
                </label>
              )}
            </div>
            <label className="block">
              <span className="text-xs text-neutral-500">{t.tagsField}</span>
              <input value={fields.tags} onChange={(e) => setFields({ ...fields, tags: e.target.value })} className={`w-full ${inputCls}`} />
            </label>
            <label className="block">
              <span className="text-xs text-neutral-500">{t.coverField}</span>
              <input value={fields.cover} onChange={(e) => setFields({ ...fields, cover: e.target.value })} className={`w-full ${inputCls}`} />
            </label>
            <label className="block">
              <span className="text-xs text-neutral-500">{t.summaryField}</span>
              <textarea value={fields.summary} onChange={(e) => setFields({ ...fields, summary: e.target.value })} rows={3} className={`w-full ${inputCls}`} />
            </label>

            {/* 评测扩展:字段收起,评测文展开填写;方法论文留空即不写库 */}
            <details className="rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2">
              <summary className="text-xs font-medium text-neutral-600 dark:text-neutral-300 cursor-pointer select-none">
                {t.reviewFieldsTitle}
              </summary>
              <div className="space-y-3 mt-3">
                <div className="grid grid-cols-3 gap-3">
                  <label className="block">
                    <span className="text-xs text-neutral-500">{t.ratingOverallField}</span>
                    <input type="number" min={0} max={5} step={0.1} value={fields.ratingOverall} onChange={(e) => setFields({ ...fields, ratingOverall: e.target.value })} className={`w-full ${inputCls}`} />
                  </label>
                  <label className="block">
                    <span className="text-xs text-neutral-500">{t.ratingEaseField}</span>
                    <input type="number" min={0} max={5} step={0.1} value={fields.ratingEaseOfUse} onChange={(e) => setFields({ ...fields, ratingEaseOfUse: e.target.value })} className={`w-full ${inputCls}`} />
                  </label>
                  <label className="block">
                    <span className="text-xs text-neutral-500">{t.ratingFeaturesField}</span>
                    <input type="number" min={0} max={5} step={0.1} value={fields.ratingFeatures} onChange={(e) => setFields({ ...fields, ratingFeatures: e.target.value })} className={`w-full ${inputCls}`} />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs text-neutral-500">{t.toolWebsiteField}</span>
                    <input value={fields.toolWebsite} onChange={(e) => setFields({ ...fields, toolWebsite: e.target.value })} className={`w-full ${inputCls}`} />
                  </label>
                  <label className="block">
                    <span className="text-xs text-neutral-500">{t.toolPricingField}</span>
                    <input value={fields.toolPricing} onChange={(e) => setFields({ ...fields, toolPricing: e.target.value })} className={`w-full ${inputCls}`} />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs text-neutral-500">{t.prosField}</span>
                    <textarea value={fields.pros} onChange={(e) => setFields({ ...fields, pros: e.target.value })} rows={4} className={`w-full ${inputCls}`} />
                  </label>
                  <label className="block">
                    <span className="text-xs text-neutral-500">{t.consField}</span>
                    <textarea value={fields.cons} onChange={(e) => setFields({ ...fields, cons: e.target.value })} rows={4} className={`w-full ${inputCls}`} />
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs text-neutral-500">{t.comparisonField}</span>
                  <textarea value={fields.comparisonColumns} onChange={(e) => setFields({ ...fields, comparisonColumns: e.target.value })} rows={3} className={`w-full font-mono text-xs ${inputCls}`} placeholder='[{"key":"price","label":"价格/月(USD)","type":"number"}]' />
                  <textarea value={fields.comparisonData} onChange={(e) => setFields({ ...fields, comparisonData: e.target.value })} rows={3} className={`w-full font-mono text-xs ${inputCls} mt-2`} placeholder='[{"id":"t1","name":"Tool A","price":19}]' />
                </label>
              </div>
            </details>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400 mt-4">{error}</p>}

          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="w-full mt-4 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50"
          >
            {publishing ? t.publishing : t.publishBtn}
          </button>
        </section>
      </div>

      {/* AI 三件套产物 */}
      {ai && (
        <section className="mt-8 grid md:grid-cols-2 gap-6">
          {ai.coverPrompts.length > 0 && (
            <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/40">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{t.coverPromptsTitle}</h3>
              </div>
              <ol className="text-xs text-neutral-600 dark:text-neutral-300 space-y-2 list-decimal list-inside">
                {ai.coverPrompts.map((p, i) => (
                  <li key={i} className="flex items-start justify-between gap-2">
                    <span className="flex-1">{p}</span>
                    <button onClick={() => copyText(`prompt-${i}`, p)} className="shrink-0 text-blue-600 dark:text-blue-400 hover:underline">
                      {copiedKey === `prompt-${i}` ? t.copied : t.copy}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {ai.tweet && (
            <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/40">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{t.tweetTitle}</h3>
                <button onClick={() => copyText('tweet', ai.tweet)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  {copiedKey === 'tweet' ? t.copied : t.copy}
                </button>
              </div>
              <pre className="text-xs text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap font-sans">{ai.tweet}</pre>
            </div>
          )}
        </section>
      )}

      {/* 发布结果 */}
      {result && (
        <section className="mt-8 p-4 rounded-lg border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <h3 className="text-sm font-semibold text-green-800 dark:text-green-400 mb-2">
            {t.resultTitle}: {result.created ? t.resultCreated : t.resultUpdated} · {result.title}
          </h3>
          <ul className="text-sm text-green-800 dark:text-green-300 space-y-1">
            {result.notionUrl && (
              <li>
                {t.notionLink}:{' '}
                <a href={result.notionUrl} target="_blank" rel="noopener noreferrer" className="underline break-all">
                  {result.notionUrl}
                </a>
              </li>
            )}
            {result.previewUrl && (
              <li>
                {t.previewLink}:{' '}
                <a href={result.previewUrl} target="_blank" rel="noopener noreferrer" className="underline break-all">
                  {result.previewUrl}
                </a>
              </li>
            )}
            <li className="text-xs">
              {t.imagesStat
                .replace('{uploaded}', String(result.images.uploaded))
                .replace('{skipped}', String(result.images.skipped))
                .replace('{missing}', String(result.images.missing.length))}
              {' · '}{result.blockCount} blocks
            </li>
            <li className="text-xs">
              {result.status === 'draft' ? t.nextStepDraft : result.status === 'scheduled' ? t.nextStepScheduled : t.nextStepPublished}
            </li>
          </ul>
          {result.warnings.length > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">{t.resultWarnings}</p>
              <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 list-disc list-inside">
                {result.warnings.map((w, i) => (
                  <li key={i} className="break-all">{w}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      resolve(dataUrl.slice(dataUrl.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader failed'));
    reader.readAsDataURL(file);
  });
}
