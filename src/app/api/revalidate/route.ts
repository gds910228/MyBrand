import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// On-demand ISR revalidation endpoint.
//
// Why this exists:
//   The home pages and blog pages use ISR (revalidate = 60). New Notion posts
//   take up to 60 s to appear after publishing. This endpoint lets you force
//   an immediate refresh — useful right after editing in Notion.
//
// Usage:
//   GET /api/revalidate?path=/&secret=YOUR_SECRET
//   GET /api/revalidate?path=/zh&secret=YOUR_SECRET
//   GET /api/revalidate?path=/blog&secret=YOUR_SECRET
//
// If `REVALIDATE_SECRET` env var is unset, the endpoint refuses to run
// (otherwise anyone on the internet could hammer your Notion quota).
//
// Multiple paths can be revalidated in one call by repeating ?path=
//   GET /api/revalidate?path=/&path=/zh&secret=...

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const secretEnv = process.env.REVALIDATE_SECRET;
  if (!secretEnv) {
    return NextResponse.json(
      { ok: false, error: 'REVALIDATE_SECRET not configured' },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  if (secret !== secretEnv) {
    return NextResponse.json({ ok: false, error: 'Invalid secret' }, { status: 401 });
  }

  // Allow ?path=/&path=/zh repeats; default to homepage + ZH homepage + both blog lists.
  const paths = searchParams.getAll('path');
  const targets = paths.length > 0 ? paths : ['/', '/zh', '/blog', '/zh/blog'];

  const revalidated: string[] = [];
  const errors: { path: string; error: string }[] = [];

  for (const p of targets) {
    try {
      revalidatePath(p);
      revalidated.push(p);
    } catch (err: any) {
      errors.push({ path: p, error: err?.message || String(err) });
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    revalidated,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: new Date().toISOString(),
  });
}
