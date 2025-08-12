import { NextResponse } from 'next/server';
import { getAllProjects } from '@/services/notion';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const language = searchParams.get('language') || undefined;

    const projects = await getAllProjects({ language });
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Projects API error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}