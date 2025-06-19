import { NextRequest, NextResponse } from 'next/server';
import { getCommentsByPostId, addComment } from '@/services/notion';

// GET /api/comments?postId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const comments = await getCommentsByPostId(postId);
    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST /api/comments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, parentId, author, content } = body;

    if (!postId || !author || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!author.name || !author.email) {
      return NextResponse.json({ error: 'Author name and email are required' }, { status: 400 });
    }

    const comment = await addComment({
      postId,
      parentId: parentId || null,
      author,
      content,
    });

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
} 