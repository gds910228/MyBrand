import { NextRequest, NextResponse } from 'next/server';
import { confirmSubscriber } from '@/services/notion';
import { rateLimited, getClientIp } from '@/lib/rateLimit';

// GET /api/subscribe/confirm?token=...&locale=en|zh
// 校验签名 token -> 置 status=active -> 重定向到确认成功页。
// Node runtime。限流防 token 枚举（spec §8）。
export const runtime = 'nodejs';
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
      return NextResponse.redirect(new URL(`${base}/subscribe/confirm?status=invalid`, request.url));
    }

    const result = await confirmSubscriber(token);
    if (!result.ok) {
      if (result.skipped) {
        return NextResponse.redirect(new URL(`${base}/subscribe/confirm?status=demo`, request.url));
      }
      // expired / not-found / bad-signature / unsubscribed 都归为 invalid 给用户
      return NextResponse.redirect(new URL(`${base}/subscribe/confirm?status=invalid`, request.url));
    }

    const statusParam = result.data.activated ? 'confirmed' : 'already';
    return NextResponse.redirect(new URL(`${base}/subscribe/confirm?status=${statusParam}`, request.url));
  } catch (error: any) {
    console.error('[subscribe/confirm] Error:', error?.message || error);
    return NextResponse.redirect(new URL('/subscribe/confirm?status=invalid', request.url));
  }
}
