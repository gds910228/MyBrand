import { Resend } from 'resend';
import type { Locale } from './notion';
import enMessages from '@/i18n/messages/en.json';
import zhMessages from '@/i18n/messages/zh.json';

/**
 * 邮件服务层（角度2）。
 * 降级：无 RESEND_API_KEY 时，所有发送降级为 console.log，返回 { ok:false, skipped:true }。
 * 模板文案走 next-intl messages（subscribe.email.*），此处只组装 HTML。
 */

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.RESEND_FROM || 'MisoTech <noreply@misotech.dev>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

type EmailOk = { ok: true; id?: string };
type EmailSkip = { ok: false; skipped: true };
type EmailErr = { ok: false; skipped?: false; error: string };
export type EmailResult = EmailOk | EmailSkip | EmailErr;

interface TemplateStrings {
  confirmSubject: string;
  confirmGreeting: string;
  confirmIntro: string;
  confirmButton: string;
  confirmIgnore: string;
  notifyGreeting: string;
  notifyIntro: string;
  notifyReadMore: string;
  notifyFooter: string;
  unsubscribeLink: string;
}

/** 从 i18n messages 读取模板文案（静态 import，resolveJsonModule 已开启）。 */
function loadTemplateStrings(locale: Locale): TemplateStrings {
  const messages = locale === 'zh' ? zhMessages : enMessages;
  return (messages.subscribe?.email || enMessages.subscribe.email) as TemplateStrings;
}

function buildConfirmHtml(t: TemplateStrings, confirmUrl: string): string {
  return `<!DOCTYPE html><html><body style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#222;">
  <p>${t.confirmGreeting}</p>
  <p>${t.confirmIntro}</p>
  <p style="margin:24px 0;">
    <a href="${confirmUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">${t.confirmButton}</a>
  </p>
  <p style="color:#888;font-size:13px;">${t.confirmIgnore}</p>
  <p style="color:#aaa;font-size:12px;">${confirmUrl}</p>
</body></html>`;
}

function buildNotifyHtml(
  t: TemplateStrings,
  post: { title: string; excerpt: string; slug: string },
  locale: Locale,
  unsubscribeUrl: string,
): string {
  const postUrl = locale === 'zh'
    ? `${SITE_URL}/zh/blog/${post.slug}`
    : `${SITE_URL}/blog/${post.slug}`;
  const excerptBlock = post.excerpt
    ? `<p style="color:#555;">${post.excerpt}</p>`
    : '';
  return `<!DOCTYPE html><html><body style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#222;">
  <p>${t.notifyGreeting}</p>
  <p>${t.notifyIntro}</p>
  <h2 style="margin:8px 0;">${post.title}</h2>
  ${excerptBlock}
  <p style="margin:24px 0;">
    <a href="${postUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">${t.notifyReadMore}</a>
  </p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
  <p style="color:#888;font-size:13px;">${t.notifyFooter}</p>
  <p style="color:#aaa;font-size:12px;"><a href="${unsubscribeUrl}">${t.unsubscribeLink}</a></p>
</body></html>`;
}

/** 发送确认邮件（double opt-in）。 */
export async function sendConfirmEmail(
  email: string,
  confirmToken: string,
  locale: Locale,
): Promise<EmailResult> {
  const t = loadTemplateStrings(locale);
  const confirmUrl = `${SITE_URL}/api/subscribe/confirm?token=${confirmToken}&locale=${locale}`;
  const html = buildConfirmHtml(t, confirmUrl);

  if (!resend) {
    console.log('[email:demo] confirm email ->', email, '\n  subject:', t.confirmSubject, '\n  confirmUrl:', confirmUrl);
    return { ok: false, skipped: true };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: t.confirmSubject,
      html,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (error: any) {
    console.error('[sendConfirmEmail] Error:', error?.message || error);
    return { ok: false, error: error?.message || 'Unknown error' };
  }
}

// ── 评论审核通知（feat-comment-moderation，spec §1.5）─────────────────────────

/** HTML 转义用户可控字段（评论作者名/邮箱/内容均来自提交者，含垃圾提交者）。 */
export function escapeHtml(input: string): string {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface CommentModerationEmailPayload {
  postId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  status: 'pending' | 'spam';
  score: number;
  reasons: string[];
}

interface CommentNotifyStrings {
  subjectPending: string;
  subjectSpam: string;
  greeting: string;
  intro: string;
  post: string;
  author: string;
  email: string;
  content: string;
  status: string;
  score: string;
  reasons: string;
  reviewLink: string;
  reviewButton: string;
  footer: string;
}

function loadCommentNotifyStrings(locale: Locale): CommentNotifyStrings {
  const messages = locale === 'zh' ? zhMessages : enMessages;
  return ((messages as any).comments?.notifyEmail ||
    (enMessages as any).comments.notifyEmail) as CommentNotifyStrings;
}

/**
 * 发送评论待审/垃圾评论通知邮件给站长。
 * 降级：无 RESEND_API_KEY 或无 COMMENT_NOTIFY_TO → console.log 完整信息 + skipped。
 * 用户输入字段全部 escapeHtml；链接只由 postId/SITE_URL 构造。
 */
export async function sendCommentModerationEmail(
  to: string | undefined,
  payload: CommentModerationEmailPayload,
  locale: Locale,
): Promise<EmailResult> {
  const t = loadCommentNotifyStrings(locale);
  const subject = payload.status === 'spam' ? t.subjectSpam : t.subjectPending;
  const html = buildCommentModerationHtml(locale, payload);
  const adminLink = `${SITE_URL}/admin/comments`;
  const excerpt = payload.content.slice(0, 200);

  if (!resend || !to) {
    console.log(
      `[email:demo] comment moderation (${payload.status}, score=${payload.score}) ->`,
      to || '(COMMENT_NOTIFY_TO not configured)',
      '\n  subject:', subject,
      '\n  postId:', payload.postId,
      '\n  author:', payload.authorName, `<${payload.authorEmail}>`,
      '\n  reasons:', payload.reasons.join(', '),
      '\n  excerpt:', excerpt,
      '\n  admin:', adminLink,
    );
    return { ok: false, skipped: true };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (error: any) {
    console.error('[sendCommentModerationEmail] Error:', error?.message || error);
    return { ok: false, error: error?.message || 'Unknown error' };
  }
}

/** 组装站长通知邮件 HTML（导出以便测试断言转义）。用户输入全部 escapeHtml。 */
export function buildCommentModerationHtml(locale: Locale, payload: CommentModerationEmailPayload): string {
  const t = loadCommentNotifyStrings(locale);
  const safePostId = encodeURIComponent(payload.postId);
  const excerpt = payload.content.slice(0, 200);
  const adminLink = `${SITE_URL}/admin/comments`;
  const postUrlEn = `${SITE_URL}/blog/${safePostId}`;
  const postUrlZh = `${SITE_URL}/zh/blog/${safePostId}`;

  return `<!DOCTYPE html><html><body style="font-family:system-ui,Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#222;">
  <p>${t.greeting}</p>
  <p>${t.intro}</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
    <tr><td style="padding:6px 12px;color:#888;width:110px;">${t.status}</td><td style="padding:6px 12px;"><b>${escapeHtml(payload.status)}</b></td></tr>
    <tr><td style="padding:6px 12px;color:#888;">${t.score}</td><td style="padding:6px 12px;">${payload.score}</td></tr>
    <tr><td style="padding:6px 12px;color:#888;">${t.reasons}</td><td style="padding:6px 12px;">${escapeHtml(payload.reasons.join(', ') || '-')}</td></tr>
    <tr><td style="padding:6px 12px;color:#888;">${t.post}</td><td style="padding:6px 12px;">${escapeHtml(payload.postId)}<br><a href="${postUrlEn}">${postUrlEn}</a><br><a href="${postUrlZh}">${postUrlZh}</a></td></tr>
    <tr><td style="padding:6px 12px;color:#888;">${t.author}</td><td style="padding:6px 12px;">${escapeHtml(payload.authorName)}</td></tr>
    <tr><td style="padding:6px 12px;color:#888;">${t.email}</td><td style="padding:6px 12px;">${escapeHtml(payload.authorEmail)}</td></tr>
    <tr><td style="padding:6px 12px;color:#888;">${t.content}</td><td style="padding:6px 12px;">${escapeHtml(excerpt)}</td></tr>
  </table>
  <p style="margin:24px 0;">
    <a href="${adminLink}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">${t.reviewButton}</a>
  </p>
  <p style="color:#aaa;font-size:12px;">${adminLink}</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
  <p style="color:#888;font-size:13px;">${t.footer}</p>
</body></html>`;
}

/** 发送新文章通知邮件。 */
export async function sendNewPostEmail(
  email: string,
  post: { title: string; excerpt: string; slug: string },
  locale: Locale,
  unsubscribeToken: string,
): Promise<EmailResult> {
  const t = loadTemplateStrings(locale);
  const unsubscribeUrl = `${SITE_URL}/api/unsubscribe?token=${unsubscribeToken}&locale=${locale}`;
  const html = buildNotifyHtml(t, post, locale, unsubscribeUrl);

  if (!resend) {
    console.log('[email:demo] new-post email ->', email, '\n  post:', post.title, '\n  unsubscribeUrl:', unsubscribeUrl);
    return { ok: false, skipped: true };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: `${t.notifyIntro} ${post.title}`,
      html,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (error: any) {
    console.error('[sendNewPostEmail] Error:', error?.message || error);
    return { ok: false, error: error?.message || 'Unknown error' };
  }
}
