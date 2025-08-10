import { Client } from '@notionhq/client';

// 评论类型定义
export interface CommentType {
  id: string;
  postId: string;
  parentId: string | null;
  author: {
    name: string;
    email: string;
    avatar?: string | null;
  };
  content: string;
  createdAt: string;
  replies?: CommentType[];
}

// 初始化Notion客户端
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// 数据库ID
const PROJECTS_DATABASE_ID = process.env.NOTION_PROJECTS_DATABASE_ID || '';
const BLOG_DATABASE_ID = process.env.NOTION_BLOG_DATABASE_ID || '';
const ABOUT_PAGE_ID = process.env.NOTION_ABOUT_PAGE_ID || '';

// 博客页面父页面ID（用于获取所有博客页面）
const BLOG_PARENT_PAGE_ID = process.env.NOTION_BLOG_PARENT_PAGE_ID || '';

// 评论数据库ID - 添加连字符以匹配Notion API期望的格式
const COMMENTS_DATABASE_ID = process.env.NOTION_COMMENTS_DATABASE_ID 
  ? process.env.NOTION_COMMENTS_DATABASE_ID.replace(/^(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})$/, '$1-$2-$3-$4-$5')
  : '';

// Notion评论页面类型
interface NotionCommentPage {
  properties: {
    name: { title: Array<{ plain_text: string }> };
    email: { email: string };
    content: { rich_text: Array<{ plain_text: string }> };
    createdAt: { date: { start: string } | null };
    postId: { rich_text: Array<{ plain_text: string }> };
    parentId: { rich_text: Array<{ plain_text: string }> };
  };
}

// 本地评论存储
let localComments: CommentType[] = [
  {
    id: 'comment-1',
    postId: 'post-getting-started-with-nextjs-14',
    parentId: null,
    author: {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80'
    },
    content: 'Great article! I\'ve been trying to learn Next.js and this was very helpful.',
    createdAt: '2023-10-26T08:30:00Z',
  },
  {
    id: 'comment-2',
    postId: 'post-getting-started-with-nextjs-14',
    parentId: 'comment-1',
    author: {
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80'
    },
    content: 'Thanks Alice! I\'m glad you found it useful. Let me know if you have any questions.',
    createdAt: '2023-10-26T09:15:00Z',
  },
  {
    id: 'comment-3',
    postId: 'post-getting-started-with-nextjs-14',
    parentId: null,
    author: {
      name: 'Robert Smith',
      email: 'robert@example.com',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80'
    },
    content: 'I\'m still confused about the App Router. Could you explain more about how it differs from the Pages Router?',
    createdAt: '2023-10-27T10:45:00Z',
  }
];

/**
 * 获取所有项目
 */
export async function getAllProjects() {
  try {
    const response = await notion.databases.query({
      database_id: PROJECTS_DATABASE_ID,
      sorts: [
        {
          property: 'Date',
          direction: 'descending',
        },
      ],
    });

    return response.results.map((page: any) => {
      // @ts-ignore - Notion API类型定义不完整
      const { properties } = page;
      
      return {
        id: page.id,
        title: properties.Title.title[0]?.plain_text || '',
        description: properties.Description.rich_text[0]?.plain_text || '',
        thumbnail: properties.Thumbnail.files[0]?.file?.url || '',
        technologies: properties.Technologies.multi_select.map((tech: any) => tech.name),
        role: properties.Role.select?.name || '',
        year: properties.Year.select?.name || '',
        // 其他属性...
      };
    });
  } catch (error) {
    console.error('Error fetching projects from Notion:', error);
    return [];
  }
}

/**
 * 获取项目详情
 */
export async function getProjectById(id: string) {
  try {
    const page = await notion.pages.retrieve({ page_id: id });
    const blocks = await notion.blocks.children.list({ block_id: id });
    
    // @ts-ignore - Notion API类型定义不完整
    const { properties } = page as any;
    
    return {
      id: page.id,
      title: properties.Title.title[0]?.plain_text || '',
      description: properties.Description.rich_text[0]?.plain_text || '',
      thumbnail: properties.Thumbnail.files[0]?.file?.url || '',
      technologies: properties.Technologies.multi_select.map((tech: any) => tech.name),
      role: properties.Role.select?.name || '',
      year: properties.Year.select?.name || '',
      client: properties.Client.rich_text[0]?.plain_text || '',
      responsibilities: properties.Responsibilities.rich_text[0]?.plain_text.split('\n') || [],
      content: blocks.results,
      // 其他属性...
    };
  } catch (error) {
    console.error('Error fetching project from Notion:', error);
    return null;
  }
}

/**
 * 获取所有博客文章（从Notion页面获取）
 */
export async function getAllBlogPosts() {
  try {
    if (!BLOG_PARENT_PAGE_ID) {
      console.error('BLOG_PARENT_PAGE_ID not configured');
      return [];
    }

    // 获取父页面下的所有子页面
    const response = await notion.blocks.children.list({
      block_id: BLOG_PARENT_PAGE_ID,
    });

    // 过滤出页面类型的块
    const pageBlocks = response.results.filter((block: any) => block.type === 'child_page');
    
    // 获取每个页面的详细信息
    const blogPosts = await Promise.all(
      pageBlocks.map(async (block: any) => {
        try {
          const page = await notion.pages.retrieve({ page_id: block.id });
          const pageAny = page as any;
          
          // 获取页面属性
          const properties = pageAny.properties;
          
          // 获取页面内容的前几段作为摘要
          const blocks = await notion.blocks.children.list({ 
            block_id: block.id,
            page_size: 5 // 只获取前5个块作为摘要
          });
          
          const firstParagraph = blocks.results.find((b: any) => b.type === 'paragraph');
          const firstParagraphAny = firstParagraph as any;
          const excerpt = firstParagraphAny?.paragraph?.rich_text?.[0]?.plain_text || '';
          
          // 获取页面封面图片
          let coverImage = '';
          if (pageAny.cover) {
            if (pageAny.cover.type === 'external') {
              coverImage = pageAny.cover.external.url;
            } else if (pageAny.cover.type === 'file') {
              coverImage = pageAny.cover.file.url;
            }
          }
          
          // 从页面属性获取元数据
          const title = block.child_page?.title || 'Untitled';
          const createdTime = new Date(pageAny.created_time);
          const lastEditedTime = new Date(pageAny.last_edited_time);
          
          return {
            id: page.id,
            title,
            excerpt: excerpt.substring(0, 200) + (excerpt.length > 200 ? '...' : ''),
            coverImage,
            date: createdTime.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            author: properties.Author?.people?.[0]?.name || 'Anonymous',
            authorImage: properties.Author?.people?.[0]?.avatar_url || '',
            readTime: Math.ceil(excerpt.split(' ').length / 200) + ' min read',
            tags: properties.Tags?.multi_select?.map((tag: any) => tag.name) || [],
            slug: title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            lastEditedTime: lastEditedTime.toISOString(),
          };
        } catch (error) {
          console.error(`Error fetching blog post ${block.id}:`, error);
          return null;
        }
      })
    );

    // 过滤掉null值并按创建时间排序
    return blogPosts
      .filter((post): post is NonNullable<typeof post> => post !== null)
      .sort((a, b) => new Date(b.lastEditedTime).getTime() - new Date(a.lastEditedTime).getTime());
  } catch (error) {
    console.error('Error fetching blog posts from Notion:', error);
    return [];
  }
}

/**
 * 获取博客文章详情（从Notion页面获取完整内容）
 */
export async function getBlogPostById(id: string) {
  try {
    const page = await notion.pages.retrieve({ page_id: id });
    const pageAny = page as any;
    
    // 获取页面的所有内容块
    const blocks = await notion.blocks.children.list({ block_id: id });
    
    // 获取页面标题
    const title = pageAny.properties?.title?.title?.[0]?.plain_text || 
                  pageAny.child_page?.title || 
                  'Untitled';
    
    // 获取页面封面
    let coverImage = '';
    if (pageAny.cover) {
      if (pageAny.cover.type === 'external') {
        coverImage = pageAny.cover.external.url;
      } else if (pageAny.cover.type === 'file') {
        coverImage = pageAny.cover.file.url;
      }
    }
    
    // 从页面属性获取元数据
    const properties = pageAny.properties;
    const createdTime = new Date(pageAny.created_time);
    const lastEditedTime = new Date(pageAny.last_edited_time);
    
    // 获取页面内容的前几段作为摘要
    const firstParagraph = blocks.results.find((b: any) => b.type === 'paragraph');
    const firstParagraphAny = firstParagraph as any;
    const excerpt = firstParagraphAny?.paragraph?.rich_text?.[0]?.plain_text?.substring(0, 200) || '';
    
    return {
      id: page.id,
      title,
      excerpt: excerpt + (excerpt.length > 200 ? '...' : ''),
      coverImage,
      date: createdTime.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      author: properties.Author?.people?.[0]?.name || 'Anonymous',
      authorImage: properties.Author?.people?.[0]?.avatar_url || '',
      readTime: Math.ceil(excerpt.split(' ').length / 200) + ' min read',
      tags: properties.Tags?.multi_select?.map((tag: any) => tag.name) || [],
      content: blocks.results,
      createdTime: createdTime.toISOString(),
      lastEditedTime: lastEditedTime.toISOString(),
    };
  } catch (error) {
    console.error('Error fetching blog post from Notion:', error);
    return null;
  }
}

/**
 * 获取关于我页面内容
 */
export async function getAboutPageContent() {
  try {
    const page = await notion.pages.retrieve({ page_id: ABOUT_PAGE_ID });
    const blocks = await notion.blocks.children.list({ block_id: ABOUT_PAGE_ID });
    
    // @ts-ignore - Notion API类型定义不完整
    const { properties } = page as any;
    
    return {
      bio: properties.Bio.rich_text[0]?.plain_text || '',
      profileImage: properties.ProfileImage.files[0]?.file?.url || '',
      skills: properties.Skills.rich_text[0]?.plain_text.split('\n').map((skill: string) => {
        const [name, level] = skill.split(':');
        return { name, level: parseInt(level) };
      }),
      experience: properties.Experience.rich_text[0]?.plain_text.split('\n\n').map((exp: string) => {
        const lines = exp.split('\n');
        return {
          title: lines[0] || '',
          company: lines[1] || '',
          period: lines[2] || '',
          description: lines.slice(3).join('\n') || '',
        };
      }),
      galleryImages: properties.GalleryImages.files.map((file: any) => file.file?.url || ''),
      content: blocks.results,
    };
  } catch (error) {
    console.error('Error fetching about page from Notion:', error);
    return null;
  }
}

/**
 * 将Notion块转换为HTML，增强媒体支持
 */
export function renderNotionBlocks(blocks: any[]) {
  let html = '';
  
  for (const block of blocks) {
    switch (block.type) {
      case 'paragraph':
        html += `<p class="mb-4 text-neutral-dark dark:text-dark-neutral-dark">${renderRichText(block.paragraph.rich_text)}</p>`;
        break;
      case 'heading_1':
        html += `<h1 class="text-3xl font-bold mb-4 text-neutral-darker dark:text-dark-neutral-darker">${renderRichText(block.heading_1.rich_text)}</h1>`;
        break;
      case 'heading_2':
        html += `<h2 class="text-2xl font-semibold mb-3 text-neutral-darker dark:text-dark-neutral-darker">${renderRichText(block.heading_2.rich_text)}</h2>`;
        break;
      case 'heading_3':
        html += `<h3 class="text-xl font-semibold mb-2 text-neutral-darker dark:text-dark-neutral-darker">${renderRichText(block.heading_3.rich_text)}</h3>`;
        break;
      case 'bulleted_list_item':
        html += `<ul class="list-disc list-inside mb-4 ml-4"><li class="mb-2 text-neutral-dark dark:text-dark-neutral-dark">${renderRichText(block.bulleted_list_item.rich_text)}</li></ul>`;
        break;
      case 'numbered_list_item':
        html += `<ol class="list-decimal list-inside mb-4 ml-4"><li class="mb-2 text-neutral-dark dark:text-dark-neutral-dark">${renderRichText(block.numbered_list_item.rich_text)}</li></ol>`;
        break;
      case 'code':
        html += `<div class="mb-4"><pre class="bg-neutral-light dark:bg-dark-neutral-light p-4 rounded-lg overflow-x-auto"><code class="language-${block.code.language} text-sm">${renderRichText(block.code.rich_text)}</code></pre></div>`;
        break;
      case 'quote':
        html += `<blockquote class="border-l-4 border-primary pl-4 mb-4 italic text-neutral-medium dark:text-dark-neutral-medium">${renderRichText(block.quote.rich_text)}</blockquote>`;
        break;
      case 'image':
        const imageUrl = block.image.type === 'external' ? block.image.external.url : block.image.file.url;
        const caption = block.image.caption ? renderRichText(block.image.caption) : '';
        html += `
          <figure class="my-6">
            <div class="relative overflow-hidden rounded-lg">
              <img 
                src="${imageUrl}" 
                alt="${caption}" 
                class="w-full h-auto rounded-lg transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
            </div>
            ${caption ? `<figcaption class="text-center text-sm text-neutral-medium dark:text-dark-neutral-medium mt-2">${caption}</figcaption>` : ''}
          </figure>
        `;
        break;
      case 'video':
        const videoUrl = block.video.type === 'external' ? block.video.external.url : block.video.file.url;
        const videoCaption = block.video.caption ? renderRichText(block.video.caption) : '';
        
        // 处理YouTube嵌入
        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
          const embedUrl = convertToEmbedUrl(videoUrl);
          html += `
            <figure class="my-6">
              <div class="relative overflow-hidden rounded-lg" style="padding-bottom: 56.25%;">
                <iframe 
                  src="${embedUrl}"
                  title="${videoCaption || 'Video'}"
                  class="absolute top-0 left-0 w-full h-full rounded-lg"
                  frameborder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                ></iframe>
              </div>
              ${videoCaption ? `<figcaption class="text-center text-sm text-neutral-medium dark:text-dark-neutral-medium mt-2">${videoCaption}</figcaption>` : ''}
            </figure>
          `;
        } else {
          // 普通视频
          html += `
            <figure class="my-6">
              <div class="relative overflow-hidden rounded-lg" style="padding-bottom: 56.25%;">
                <video 
                  controls 
                  class="absolute top-0 left-0 w-full h-full rounded-lg"
                  src="${videoUrl}"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
              ${videoCaption ? `<figcaption class="text-center text-sm text-neutral-medium dark:text-dark-neutral-medium mt-2">${videoCaption}</figcaption>` : ''}
            </figure>
          `;
        }
        break;
      case 'embed':
        const embedUrl = block.embed.url;
        html += `
          <div class="my-6">
            <div class="relative overflow-hidden rounded-lg" style="padding-bottom: 56.25%;">
              <iframe 
                src="${embedUrl}"
                class="absolute top-0 left-0 w-full h-full rounded-lg"
                frameborder="0"
                allowfullscreen
              ></iframe>
            </div>
          </div>
        `;
        break;
      case 'divider':
        html += '<hr class="my-8 border-neutral-light dark:border-dark-neutral-light" />';
        break;
      case 'callout':
        const calloutIcon = block.callout.icon?.emoji || '💡';
        html += `
          <div class="my-6 p-4 bg-primary/10 border-l-4 border-primary rounded-r-lg">
            <div class="flex items-start">
              <span class="text-xl mr-3">${calloutIcon}</span>
              <div class="text-neutral-dark dark:text-dark-neutral-dark">${renderRichText(block.callout.rich_text)}</div>
            </div>
          </div>
        `;
        break;
    }
  }
  
  return html;
}

/**
 * 将YouTube URL转换为嵌入URL
 */
function convertToEmbedUrl(url: string): string {
  const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(youtubeRegex);
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return url;
}

/**
 * 渲染富文本
 */
function renderRichText(richText: any[]) {
  return richText.map((text: any) => {
    let content = text.plain_text;
    
    if (text.annotations.bold) {
      content = `<strong>${content}</strong>`;
    }
    
    if (text.annotations.italic) {
      content = `<em>${content}</em>`;
    }
    
    if (text.annotations.strikethrough) {
      content = `<del>${content}</del>`;
    }
    
    if (text.annotations.underline) {
      content = `<u>${content}</u>`;
    }
    
    if (text.annotations.code) {
      content = `<code>${content}</code>`;
    }
    
    if (text.href) {
      content = `<a href="${text.href}" target="_blank" rel="noopener noreferrer">${content}</a>`;
    }
    
    return content;
  }).join('');
}

/**
 * 根据文章ID获取评论
 * @param postId 文章ID
 * @returns 评论列表
 */
export const getCommentsByPostId = async (postId: string): Promise<CommentType[]> => {
  try {
    // 检查是否配置了Notion API密钥和数据库ID
    if (!process.env.NOTION_API_KEY || !COMMENTS_DATABASE_ID) {
      console.log('Notion API key or database ID not configured, using local storage');
      return getLocalCommentsByPostId(postId);
    }

    const response = await notion.databases.query({
      database_id: COMMENTS_DATABASE_ID,
      filter: {
        property: 'PostId',
        rich_text: {
          equals: postId,
        },
      },
    });

    const comments = response.results.map((page) => {
      // @ts-ignore - Notion API类型定义不完整
      const { properties } = page as any;
      
      return {
        id: page.id,
        postId: properties.PostId.rich_text[0]?.plain_text || '',
        parentId: properties.ParentId.rich_text[0]?.plain_text || null,
        author: {
          name: properties.AuthorName.rich_text[0]?.plain_text || '',
          email: properties.AuthorEmail.email || '',
          avatar: properties.AuthorAvatar?.url || null,
        },
        content: properties.Content.rich_text[0]?.plain_text || '',
        createdAt: new Date(properties.CreatedAt.date?.start || Date.now()).toISOString(),
        replies: [],
      } as CommentType;
    });

    // 构建评论树
    const commentMap = new Map<string, CommentType>();
    const rootComments: CommentType[] = [];

    comments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    comments.forEach((comment) => {
      if (comment.parentId) {
        const parentComment = commentMap.get(comment.parentId);
        if (parentComment && parentComment.replies) {
          parentComment.replies.push(commentMap.get(comment.id) as CommentType);
        }
      } else {
        rootComments.push(commentMap.get(comment.id) as CommentType);
      }
    });

    return rootComments;
  } catch (error) {
    console.error('Error fetching comments from Notion:', error);
    // 使用本地存储作为备选方案
    return getLocalCommentsByPostId(postId);
  }
};

/**
 * 添加评论
 * @param comment 评论数据
 * @returns 添加的评论
 */
export const addComment = async (comment: Omit<CommentType, 'id' | 'createdAt'>): Promise<CommentType> => {
  try {
    // 检查是否配置了Notion API密钥和数据库ID
    if (!process.env.NOTION_API_KEY || !COMMENTS_DATABASE_ID) {
      console.log('Notion API key or database ID not configured, using local storage');
      return addLocalComment(comment);
    }

    // 准备评论数据
    const properties: any = {
      AuthorEmail: {
        email: comment.author.email,
      },
      Content: {
        rich_text: [
          {
            text: {
              content: comment.content,
            },
          },
        ],
      },
      CreatedAt: {
        date: {
          start: new Date().toISOString(),
        },
      },
      PostId: {
        rich_text: [
          {
            text: {
              content: comment.postId,
            },
          },
        ],
      },
      ParentId: {
        rich_text: comment.parentId
          ? [
              {
                text: {
                  content: comment.parentId,
                },
              },
            ]
          : [],
      },
    };

    // 根据Notion数据库列类型设置作者名称
    properties.AuthorName = {
      rich_text: [
        {
          text: {
            content: comment.author.name || '',
          },
        },
      ],
    };

    // 如果有头像URL，则添加
    if (comment.author.avatar) {
      properties.AuthorAvatar = {
        url: comment.author.avatar,
      };
    } else {
      // 如果没有头像，使用默认头像或null
      properties.AuthorAvatar = {
        url: null,
      };
    }

    const response = await notion.pages.create({
      parent: {
        database_id: COMMENTS_DATABASE_ID,
      },
      properties: properties,
    });

    // 返回添加的评论
    return {
      id: response.id,
      postId: comment.postId,
      parentId: comment.parentId,
      author: comment.author,
      content: comment.content,
      createdAt: new Date().toISOString(),
      replies: [],
    };
  } catch (error) {
    console.error('Error adding comment to Notion:', error);
    // 使用本地存储作为备选方案
    return addLocalComment(comment);
  }
};

/**
 * 从本地存储获取评论
 */
function getLocalCommentsByPostId(postId: string): CommentType[] {
  const allComments = localComments.filter(comment => comment.postId === postId);
  return buildCommentTree(allComments);
}

/**
 * 添加本地评论
 */
function addLocalComment(comment: Omit<CommentType, 'id' | 'createdAt'>): CommentType {
  const newComment: CommentType = {
    id: `comment-${Date.now()}`,
    postId: comment.postId,
    parentId: comment.parentId,
    author: {
      name: comment.author.name,
      email: comment.author.email,
      avatar: comment.author.avatar,
    },
    content: comment.content,
    createdAt: new Date().toISOString(),
    replies: [],
  };

  localComments.push(newComment);
  return newComment;
}

/**
 * 构建评论树
 */
function buildCommentTree(comments: CommentType[]): CommentType[] {
  const commentTree: CommentType[] = [];
  const commentMap = new Map<string, CommentType>();
  
  // 首先将所有评论放入Map中
  comments.forEach(comment => {
    commentMap.set(comment.id, comment);
  });
  
  // 然后构建评论树
  comments.forEach(comment => {
    if (!comment.parentId) {
      // 这是顶级评论
      commentTree.push(comment);
    } else {
      // 这是回复
      const parentComment = commentMap.get(comment.parentId);
      if (parentComment) {
        if (!parentComment.replies) {
          parentComment.replies = [];
        }
        parentComment.replies.push(commentMap.get(comment.id) as CommentType);
      }
    }
  });
  
  return commentTree;
} 