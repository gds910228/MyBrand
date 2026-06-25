import { NextRequest, NextResponse } from 'next/server';
import { addInquiry, type InquiryPayload } from '@/services/notion';

// Notion write is best-effort. Even when the Notion DB isn't configured
// (or fails), this endpoint still returns 200 so the client treats the
// EmailJS-side delivery as the source of truth. The response body always
// tells the client whether the Notion write actually persisted.
//
// POST /api/inquiries
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<InquiryPayload>;

    // Manual validation — same convention as /api/comments.
    const required: (keyof InquiryPayload)[] = [
      'name', 'email', 'serviceType', 'budget', 'timeline', 'description', 'locale',
    ];
    for (const field of required) {
      const value = body[field];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return NextResponse.json(
          { ok: false, error: `Missing required field: ${field}` },
          { status: 400 },
        );
      }
    }

    if (typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid email address' },
        { status: 400 },
      );
    }

    if (body.locale !== 'en' && body.locale !== 'zh') {
      return NextResponse.json(
        { ok: false, error: 'Invalid locale (must be "en" or "zh")' },
        { status: 400 },
      );
    }

    if (typeof body.description !== 'string' || body.description.trim().length < 30) {
      return NextResponse.json(
        { ok: false, error: 'Description must be at least 30 characters' },
        { status: 400 },
      );
    }

    const result = await addInquiry({
      name: body.name!.trim(),
      email: body.email.trim(),
      company: body.company?.trim() || undefined,
      backupContact: body.backupContact?.trim() || undefined,
      serviceType: body.serviceType!,
      budget: body.budget!,
      timeline: body.timeline!,
      description: body.description.trim(),
      referral: body.referral?.trim() || undefined,
      locale: body.locale,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('[POST /api/inquiries] Unexpected error:', error?.message || error);
    return NextResponse.json(
      { ok: false, error: 'Failed to process inquiry' },
      { status: 500 },
    );
  }
}
