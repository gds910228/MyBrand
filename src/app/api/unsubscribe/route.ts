import { NextRequest, NextResponse } from 'next/server';
import { unsubscribe } from '@/services/notion';
import { rateLimited, getClientIp } from '@/lib/rateLimit';

// GET /api/unsubscribe?token=...&locale=en|zh
// 校验签名 token -> 置 status=unsubscribed -> 重定向到退订确认页。
// Node runtime。限流防 token 枚举（spec §8）。
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (rateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const locale = searchParams.get('locale') === 'zh' ? 'zh' : 'en';
    const base = locale === 'zh' ? '/zh' : '';

    if (!token) {
      return NextResponse.redirect(new URL(`${base}/unsubscribe?status=invalid`, request.url));
    }

    const result = await unsubscribe(token);
    if (!result.ok) {
      if (result.skipped) {
        return NextResponse.redirect(new URL(`${base}/unsubscribe?status=demo`, request.url));
      }
      return NextResponse.redirect(new URL(`${base}/unsubscribe?status=invalid`, request.url));
    }

    return NextResponse.redirect(new URL(`${base}/unsubscribe?status=done`, request.url));
  } catch (error: any) {
    console.error('[unsubscribe] Error:', error?.message || error);
    return NextResponse.redirect(new URL('/unsubscribe?status=invalid', request.url));
  }
}
