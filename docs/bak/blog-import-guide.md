# 博客文章导入指南

## 文章数据结构

我已经为您创建了5篇高质量的AI工具评测文章（3篇英文，2篇中文），每篇文章都包含以下内容：

- 基本信息：标题、摘要、发布日期、作者、标签等
- 评测数据：总体评分、易用性评分、功能评分
- 优缺点分析：详细的优点和缺点列表
- 工具信息：官网链接、价格信息
- 对比表数据：完整的ComparisonColumns和ComparisonData JSON

## 如何导入到Notion

### 方法1：手动复制粘贴（推荐）

1. 打开`docs/blog-posts-sample.json`文件
2. 对于每篇文章：
   - 在Notion博客数据库中创建新页面
   - 填写Title、Slug、Language、Status、PublishDate等基本字段
   - 将Summary粘贴到摘要字段
   - 将Tags数组添加到标签多选字段
   - 将CoverImage值填入封面图字段（可以是文件名或URL）
   - 将Rating_Overall、Rating_EaseOfUse、Rating_Features填入对应评分字段
   - 将Pros和Cons文本粘贴到优缺点字段
   - 将Tool_Website和Tool_Pricing填入工具信息字段
   - **重要**：将ComparisonColumns和ComparisonData完整JSON粘贴到对应字段

### 方法2：使用Notion API导入

如果您熟悉编程，可以使用Notion API批量导入这些文章：

```javascript
const { Client } = require('@notionhq/client');
const fs = require('fs');

// 初始化Notion客户端
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// 读取文章数据
const blogPosts = JSON.parse(fs.readFileSync('./docs/blog-posts-sample.json', 'utf8'));

// 数据库ID
const BLOG_DATABASE_ID = process.env.NOTION_BLOG_DATABASE_ID;

// 导入每篇文章
async function importPosts() {
  for (const post of blogPosts) {
    try {
      await notion.pages.create({
        parent: { database_id: BLOG_DATABASE_ID },
        properties: {
          Title: { title: [{ text: { content: post.Title } }] },
          Slug: { rich_text: [{ text: { content: post.Slug } }] },
          Language: { select: { name: post.Language } },
          Status: { select: { name: post.Status } },
          PublishDate: { date: { start: post.PublishDate } },
          Summary: { rich_text: [{ text: { content: post.Summary } }] },
          Tags: { multi_select: post.Tags.map(tag => ({ name: tag })) },
          CoverImage: { rich_text: [{ text: { content: post.CoverImage } }] },
          Author: { rich_text: [{ text: { content: post.Author } }] },
          Rating_Overall: { number: post.Rating_Overall },
          Rating_EaseOfUse: { number: post.Rating_EaseOfUse },
          Rating_Features: { number: post.Rating_Features },
          Pros: { rich_text: [{ text: { content: post.Pros } }] },
          Cons: { rich_text: [{ text: { content: post.Cons } }] },
          Tool_Website: { url: post.Tool_Website },
          Tool_Pricing: { rich_text: [{ text: { content: post.Tool_Pricing } }] },
          ComparisonColumns: { rich_text: [{ text: { content: JSON.stringify(post.ComparisonColumns) } }] },
          ComparisonData: { rich_text: [{ text: { content: JSON.stringify(post.ComparisonData) } }] }
        }
      });
      console.log(`Imported: ${post.Title}`);
    } catch (error) {
      console.error(`Error importing ${post.Title}:`, error);
    }
  }
}

importPosts();
```

## 封面图片

为了确保封面图片正常显示，您有两个选择：

1. **使用Notion上传**：在每篇文章中，通过Files & Media上传封面图片
2. **使用本地文件**：将示例中的图片名称（如`chatgpt-claude-comparison.jpg`）保存到您的`/public/images/covers/`目录下

## 对比表使用说明

每篇文章都包含了完整的对比表数据，可以直接在文章详情页中显示。对比表支持以下功能：

- 点击表头排序
- "最佳"值高亮显示
- 响应式设计（移动端可横向滚动）
- 多种数据类型：文本、数字、评分、布尔值、徽章、链接

## 下一步

1. 导入这些示例文章到您的Notion数据库
2. 确保ComparisonColumns和ComparisonData字段正确设置
3. 访问文章详情页，验证对比表是否正确渲染
4. 根据需要调整文章内容和对比表数据

如有任何问题，请随时联系我，我可以帮助您：

1. 调整对比表的列定义
2. 为特定工具生成更多评测数据
3. 创建更多博客文章样本
4. 解决导入过程中的技术问题

## 文章内容建议

除了已提供的元数据外，每篇文章还应包含以下内容块：

1. **介绍段落**：简要介绍评测主题和目标
2. **工具概述**：被评测工具的背景和主要功能
3. **评测方法**：如何进行评测，使用了哪些标准
4. **详细评测**：按功能点逐一分析
5. **使用场景**：适合哪些用户群体和使用场景
6. **结论**：总结评测结果和推荐意见

这些内容可以通过Notion页面的内容块直接编辑添加。

## 对比表自定义

如果您想自定义对比表，可以修改ComparisonColumns中的以下属性：

- `key`: 对应数据字段名
- `label`: 显示的列标题
- `type`: 数据类型（text/number/rating/boolean/badge/link）
- `align`: 对齐方式（left/center/right）
- `higherIsBetter`: 数值/评分是否"越高越好"
- `highlight`: 是否高亮"最佳"值
- `width`: 列宽（如"120px"）

祝您的AI工具评测博客取得成功！
