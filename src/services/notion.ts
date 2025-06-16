import { Client } from '@notionhq/client';

// 初始化Notion客户端
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// 数据库ID
const PROJECTS_DATABASE_ID = process.env.NOTION_PROJECTS_DATABASE_ID || '';
const BLOG_DATABASE_ID = process.env.NOTION_BLOG_DATABASE_ID || '';
const ABOUT_PAGE_ID = process.env.NOTION_ABOUT_PAGE_ID || '';

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