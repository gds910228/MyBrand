import webpush from 'web-push';
import { listSubscribers, clearPushSubscription, type SubscriberType, type Locale } from './notion';

/**
 * Web Push 服务层（角度2）。
 * 降级：无 VAPID Key 时，notifyAllSubscribers 降级为 console.log，不发送。
 * 失败隔离：单订阅失败不影响其他；410/404 永久失效直接清理，瞬态错误重试一次。
 *
 * 注意：setVapidDetails 延迟到首次调用（lazy init），避免 build 期模块加载时
 * 在无环境变量的环境（如 Vercel build）触发异常。
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

let vapidReady = false;

function ensureVapid(): boolean {
  if (vapidReady) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
  const privateKey = process.env.VAPID_PRIVATE_KEY || '';
  const subject = process.env.VAPID_SUBJECT || 'mailto:noreply@misotech.dev';
  if (!publicKey || !privateKey) return false;
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidReady = true;
    return true;
  } catch (e) {
    console.error('[push] setVapidDetails failed:', e);
    return false;
  }
}

interface NotifyPost {
  slug: string;
  title: string;
  excerpt: string;
}

export interface PushNotifyCount {
  pushOk: number;
  pushFail: number;
  pushSkipped: number;
}

function buildPayload(post: NotifyPost, locale: Locale): { title: string; body: string; url: string } {
  const url = locale === 'zh'
    ? `${SITE_URL}/zh/blog/${post.slug}`
    : `${SITE_URL}/blog/${post.slug}`;
  const title = locale === 'zh' ? 'MisoTech 新文章' : 'MisoTech New Article';
  const body = post.excerpt ? `${post.title} - ${post.excerpt.slice(0, 80)}` : post.title;
  return { title, body, url };
}

/** 单订阅发送，返回瞬态/永久失败判定。 */
async function sendOne(
  subscription: PushSubscriptionJSON,
  payload: string,
): Promise<{ ok: boolean; permanent: boolean; error?: string }> {
  try {
    // web-push 期望 keys 与 endpoint；PushSubscriptionJSON 结构兼容
    await webpush.sendNotification(
      subscription as any,
      payload,
    );
    return { ok: true, permanent: false };
  } catch (err: any) {
    const status = err?.statusCode;
    // 404/410 = subscription 失效（永久），429/5xx = 瞬态
    const permanent = status === 404 || status === 410;
    return { ok: false, permanent, error: err?.message || String(err) };
  }
}

/**
 * 给所有有 pushSubscription 的订阅者推新文章通知。
 * 单失败隔离；永久失效清理；瞬态错误重试一次。返回计数。
 * 无 VAPID Key 时打印 + 返回 skipped。
 */
export async function notifyAllSubscribers(post: NotifyPost): Promise<PushNotifyCount> {
  if (!ensureVapid()) {
    console.log('[push:demo] notify ->', post.title, '\n  (无 VAPID Key，仅打印)');
    return { pushOk: 0, pushFail: 0, pushSkipped: 0 };
  }

  const subs = await listSubscribers({ hasPush: true });
  if (subs.length === 0) {
    return { pushOk: 0, pushFail: 0, pushSkipped: 0 };
  }

  let pushOk = 0;
  let pushFail = 0;
  const toCleanup: string[] = []; // endpoint 列表

  await Promise.all(
    subs.map(async (sub: SubscriberType) => {
      if (!sub.pushSubscription) return;
      let parsed: PushSubscriptionJSON;
      try {
        parsed = JSON.parse(sub.pushSubscription);
      } catch {
        pushFail++;
        return;
      }
      const locale: Locale = sub.locale === 'zh' ? 'zh' : 'en';
      const payload = JSON.stringify(buildPayload(post, locale));

      const r1 = await sendOne(parsed, payload);
      if (r1.ok) {
        pushOk++;
        return;
      }
      if (r1.permanent) {
        // 永久失效：不重试，标记清理
        if (parsed.endpoint) toCleanup.push(parsed.endpoint);
        pushFail++;
        return;
      }
      // 瞬态错误：重试一次
      const r2 = await sendOne(parsed, payload);
      if (r2.ok) pushOk++;
      else {
        pushFail++;
        if (r2.permanent && parsed.endpoint) toCleanup.push(parsed.endpoint);
      }
    }),
  );

  // 清理失效订阅（失败不影响计数已计）
  for (const endpoint of toCleanup) {
    await clearPushSubscription(endpoint);
  }

  return { pushOk, pushFail, pushSkipped: 0 };
}
