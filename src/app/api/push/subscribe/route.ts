import { NextRequest, NextResponse } from 'next/server';
import { addPushSubscription } from '@/services/notion';

// POST /api/push/subscribe  { subscription: PushSubscriptionJSON }
// 注册 Web Push 订阅，落库（解耦，不依赖先订阅 email）。
// VAPID 公钥前端直读 NEXT_PUBLIC_VAPID_PUBLIC_KEY，不单独建下发接口。
// Node runtime。
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const subscription: PushSubscriptionJSON | undefined = body?.subscription;
    const locale = body?.locale === 'zh' ? 'zh' : 'en';

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    const result = await addPushSubscription(subscription, locale);
    if (!result.ok) {
      if (result.skipped) {
        return NextResponse.json({ ok: true, demo: true, message: 'Notion not configured (demo mode)' });
      }
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[push/subscribe] Error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to register push subscription' }, { status: 500 });
  }
}
