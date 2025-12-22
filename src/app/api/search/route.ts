import { NextResponse } from 'next/server';
import { getAllBlogPosts, getAllProjects, getBlogPostById } from '@/services/notion';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const language = searchParams.get('language') || 'English';

  console.log(`[API] Search request: query="${query}", language="${language}"`);

  if (!query?.trim()) {
    return NextResponse.json({ results: [], count: 0 });
  }

  try {
    // Server-side data fetching with all environment variables available
    const [postsResult, projectsResult] = await Promise.allSettled([
      getAllBlogPosts({ language }).catch(err => {
        console.error('[API] Failed to load blog posts:', err);
        return [];
      }),
      getAllProjects({}).catch(err => {
        console.error('[API] Failed to load projects:', err);
        return [];
      })
    ]);

    const blogPosts = Array.isArray(postsResult) ? postsResult :
                     (postsResult.status === 'fulfilled' ? postsResult.value : []);
    const projectData = Array.isArray(projectsResult) ? projectsResult :
                        (projectsResult.status === 'fulfilled' ? projectsResult.value : []);

    console.log(`[API] Loaded ${blogPosts.length} posts, ${projectData.length} projects`);

    // Optimized search: only get full content for highly relevant posts first
    // Start with basic search on metadata to filter candidates
    const lowercaseQuery = query.toLowerCase();

    // Quick initial filtering based on metadata only
    const candidates = [
      ...blogPosts.map(post => ({
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        type: 'blog' as const,
        date: post.date,
        tags: post.tags,
        readTime: post.readTime,
        content: [] as any[]
      })),
      ...projectData.map(project => ({
        id: project.id,
        slug: project.slug,
        title: project.title,
        excerpt: project.description,
        type: 'project' as const,
        date: project.date || project.createdTime || new Date().toISOString(),
        technologies: project.technologies,
        content: [] as any[]
      }))
    ];

    // Pre-filter based on metadata to reduce API calls
    const preFiltered = candidates.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(lowercaseQuery);
      const excerptMatch = item.excerpt?.toLowerCase().includes(lowercaseQuery);
      const tagsMatch = item.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery));
      const techMatch = item.technologies?.some(tech => tech.toLowerCase().includes(lowercaseQuery));

      return titleMatch || excerptMatch || tagsMatch || techMatch;
    });

    console.log(`[API] Pre-filtered ${preFiltered.length} candidates out of ${candidates.length}`);

    // Get full content only for top candidates (limit to 10 for performance)
    const postsWithContent = await Promise.all(
      preFiltered
        .filter(item => item.type === 'blog')
        .slice(0, 10)
        .map(async (post) => {
          try {
            const fullPost = await getBlogPostById(post.id);
            return {
              ...post,
              content: fullPost?.content || []
            };
          } catch (error) {
            console.warn(`[API] Failed to load full content for post ${post.id}:`, error);
            return post;
          }
        })
    );

    // Combine content-aware posts with other candidates
    const combinedContent = [
      ...postsWithContent,
      ...preFiltered.filter(item => item.type !== 'blog' || !postsWithContent.find(p => p.id === item.id))
    ];

    // Extract text from Notion content blocks
    const extractTextFromNotionContent = (content: any[]): string => {
      if (!content || !Array.isArray(content)) return '';

      return content.map(block => {
        if (block.type === 'paragraph' && block.paragraph?.rich_text) {
          return block.paragraph.rich_text.map((text: any) => text.plain_text || '').join('');
        }
        if (block.type === 'heading_1' && block.heading_1?.rich_text) {
          return block.heading_1.rich_text.map((text: any) => text.plain_text || '').join('');
        }
        if (block.type === 'heading_2' && block.heading_2?.rich_text) {
          return block.heading_2.rich_text.map((text: any) => text.plain_text || '').join('');
        }
        if (block.type === 'heading_3' && block.heading_3?.rich_text) {
          return block.heading_3.rich_text.map((text: any) => text.plain_text || '').join('');
        }
        if (block.type === 'bulleted_list_item' && block.bulleted_list_item?.rich_text) {
          return block.bulleted_list_item.rich_text.map((text: any) => text.plain_text || '').join('');
        }
        if (block.type === 'numbered_list_item' && block.numbered_list_item?.rich_text) {
          return block.numbered_list_item.rich_text.map((text: any) => text.plain_text || '').join('');
        }
        if (block.type === 'quote' && block.quote?.rich_text) {
          return block.quote.rich_text.map((text: any) => text.plain_text || '').join('');
        }
        return '';
      }).join(' ');
    };

    // Enhanced search with better scoring
    const calculateSearchScore = (item: any, query: string, contentText: string): number => {
      const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 0);
      let score = 0;
      const titleLower = item.title.toLowerCase();
      const excerptLower = (item.excerpt || '').toLowerCase();
      const contentLower = contentText.toLowerCase();

      // Title matches (highest priority)
      queryWords.forEach(word => {
        // Exact title match gets very high score
        if (titleLower === word) score += 50;
        // Title contains exact word
        else if (titleLower.includes(word)) score += 25;
        // Title contains partial match
        else if (titleLower.includes(word.substring(0, Math.floor(word.length / 2)))) score += 10;
      });

      // Content matches
      queryWords.forEach(word => {
        // Count occurrences in content
        const contentMatches = (contentLower.match(new RegExp(word, 'g')) || []).length;
        score += Math.min(contentMatches * 3, 15); // Cap content points

        // Exact content phrase match
        if (contentLower.includes(word)) score += 8;
      });

      // Excerpt matches
      queryWords.forEach(word => {
        if (excerptLower.includes(word)) score += 12;
      });

      // Tag matches
      item.tags?.forEach((tag: string) => {
        queryWords.forEach(word => {
          if (tag.toLowerCase().includes(word)) score += 6;
        });
      });

      // Technology matches (for projects)
      item.technologies?.forEach((tech: string) => {
        queryWords.forEach(word => {
          if (tech.toLowerCase().includes(word)) score += 6;
        });
      });

      // Bonus for recent content (within last 30 days)
      const itemDate = new Date(item.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (itemDate > thirtyDaysAgo) score += 5;

      return score;
    };

    const searchResults = combinedContent.map(item => {
      const contentText = extractTextFromNotionContent(item.content || []);
      const score = calculateSearchScore(item, query, contentText);
      return { ...item, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => {
      // Sort by score first, then by date
      if (a.score !== b.score) return b.score - a.score;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })
    .slice(0, 20); // Limit results for performance

    console.log(`[API] Search complete: found ${searchResults.length} results for "${query}"`);

    return NextResponse.json({
      results: searchResults,
      count: searchResults.length,
      query
    });

  } catch (error) {
    console.error('[API] Search error:', error);
    return NextResponse.json(
      { error: 'Search failed', message: error.message },
      { status: 500 }
    );
  }
}