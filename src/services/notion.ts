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
 * 获取所有博客文章
 */
export async function getAllBlogPosts() {
  try {
    const response = await notion.databases.query({
      database_id: BLOG_DATABASE_ID,
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
        excerpt: properties.Excerpt.rich_text[0]?.plain_text || '',
        coverImage: properties.CoverImage.files[0]?.file?.url || '',
        date: new Date(properties.Date.date?.start || '').toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        author: properties.Author.select?.name || '',
        authorImage: properties.AuthorImage.files[0]?.file?.url || '',
        readTime: properties.ReadTime.rich_text[0]?.plain_text || '',
        tags: properties.Tags.multi_select.map((tag: any) => tag.name),
      };
    });
  } catch (error) {
    console.error('Error fetching blog posts from Notion:', error);
    return [];
  }
}

/**
 * 获取博客文章详情
 */
export async function getBlogPostById(id: string) {
  try {
    const page = await notion.pages.retrieve({ page_id: id });
    const blocks = await notion.blocks.children.list({ block_id: id });
    
    // @ts-ignore - Notion API类型定义不完整
    const { properties } = page as any;
    
    return {
      id: page.id,
      title: properties.Title.title[0]?.plain_text || '',
      excerpt: properties.Excerpt.rich_text[0]?.plain_text || '',
      coverImage: properties.CoverImage.files[0]?.file?.url || '',
      date: new Date(properties.Date.date?.start || '').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      author: properties.Author.select?.name || '',
      authorImage: properties.AuthorImage.files[0]?.file?.url || '',
      readTime: properties.ReadTime.rich_text[0]?.plain_text || '',
      tags: properties.Tags.multi_select.map((tag: any) => tag.name),
      content: blocks.results,
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
 * 将Notion块转换为HTML
 */
export function renderNotionBlocks(blocks: any[]) {
  let html = '';
  
  for (const block of blocks) {
    switch (block.type) {
      case 'paragraph':
        html += `<p>${renderRichText(block.paragraph.rich_text)}</p>`;
        break;
      case 'heading_1':
        html += `<h1>${renderRichText(block.heading_1.rich_text)}</h1>`;
        break;
      case 'heading_2':
        html += `<h2>${renderRichText(block.heading_2.rich_text)}</h2>`;
        break;
      case 'heading_3':
        html += `<h3>${renderRichText(block.heading_3.rich_text)}</h3>`;
        break;
      case 'bulleted_list_item':
        html += `<ul><li>${renderRichText(block.bulleted_list_item.rich_text)}</li></ul>`;
        break;
      case 'numbered_list_item':
        html += `<ol><li>${renderRichText(block.numbered_list_item.rich_text)}</li></ol>`;
        break;
      case 'code':
        html += `<pre><code class="language-${block.code.language}">${renderRichText(block.code.rich_text)}</code></pre>`;
        break;
      case 'quote':
        html += `<blockquote>${renderRichText(block.quote.rich_text)}</blockquote>`;
        break;
      case 'image':
        const imageUrl = block.image.type === 'external' ? block.image.external.url : block.image.file.url;
        html += `<figure><img src="${imageUrl}" alt="${block.image.caption ? renderRichText(block.image.caption) : ''}" />${block.image.caption ? `<figcaption>${renderRichText(block.image.caption)}</figcaption>` : ''}</figure>`;
        break;
      // 其他块类型...
    }
  }
  
  return html;
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