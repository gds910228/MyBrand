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
