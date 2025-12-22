import { NextResponse } from 'next/server';

export async function GET() {
  console.log('[Test] API endpoint called');

  try {
    // Test basic Notion connectivity
    const response = await fetch('https://api.notion.com/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[Test] Notion API connection successful');
      return NextResponse.json({
        status: 'success',
        message: 'Notion API connection working',
        user: data.name || 'Unknown'
      });
    } else {
      console.error('[Test] Notion API connection failed:', response.status);
      return NextResponse.json({
        status: 'error',
        message: `Notion API connection failed: ${response.status}`
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[Test] Error:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message
    }, { status: 500 });
  }
}