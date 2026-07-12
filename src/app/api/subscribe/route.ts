import { NextRequest, NextResponse } from 'next/server';
import { addSubscriber } from '@/services/notion';
import { sendConfirmEmail } from '@/services/email';
import type { Locale } from '@/services/notion';
import { rateLimited, getClientIp } from '@/lib/rateLimit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/subscribe  { email, locale }
// Node runtime（web-push/email 间接依赖 Node crypto）。
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (rateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const email: string = (body?.email || '').toString().trim().toLowerCase();
    const locale: Locale = body?.locale === 'zh' ? 'zh' : 'en';

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const result = await addSubscriber(email, locale);
    if (!result.ok) {
      if (result.skipped) {
        // Notion 未配置：落库降级，但仍视为接受（demo 模式）
        return NextResponse.json({ ok: true, demo: true, message: 'Notion not configured (demo mode)' });
      }
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // 发确认邮件（无 RESEND_API_KEY 时内部降级打印）
    const confirmToken = result.data.token;
    await sendConfirmEmail(email, confirmToken, locale);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[subscribe] Error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
