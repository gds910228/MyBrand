/**
 * AI 三件套提示词模板(feat-publish-pipeline)。
 *
 * 固化自用户既有工作流(网页 Gemini 手工跑的提示词),一次调用产出:
 * 1. Blog 数据库全字段(严格按 Notion schema 输出真实数据)
 * 2. 封面文生图提示词 ×3(16:9)
 * 3. Twitter 爆款推文(带个人站外链,服务外链 SEO)
 *
 * 提示词与代码分离:调优时只改本文件,不改调用逻辑。
 */

export interface TrioPromptOptions {
  /** 个人站 base URL,如 https://www.misotebo.win → 推文外链用 */
  siteUrl: string;
}

export const TRIO_JSON_SHAPE = `{
  "fields": {
    "Title": "文章标题",
    "Language": "Chinese | English",
    "Summary": "60-100字摘要",
    "Tags": ["标签1", "标签2", "标签3"],
    "Slug": "english-slug",
    "Rating_Overall": 4.8,
    "Rating_EaseOfUse": 4.2,
    "Rating_Features": 5.0,
    "Pros": ["优点1", "优点2", "优点3"],
    "Cons": ["缺点1", "缺点2"],
    "Tool_Website": "https://...",
    "Tool_Pricing": "订阅 $10/月起",
    "ComparisonColumns": [],
    "ComparisonData": []
  },
  "coverPrompts": ["文生图提示词1", "提示词2", "提示词3"],
  "tweet": "推文全文"
}`;

const FIELDS_SPEC = `按以下 Notion Blog 数据库 Schema 输出真实数据(非评测类文章,评分/优缺点/对比表字段可为 null 或省略):

- **Title**: 文章标题(精炼、有信息量,可直接用作博客标题)
- **Language**: 根据文章语言输出 Chinese 或 English
- **Summary**: 60-100 字中文摘要(英文文章则输出英文摘要),概括核心价值
- **Tags**: 3-6 个标签,如 "AI图像生成", "Midjourney", "工具评测"
- **Slug**: 小写英文短横线 slug(如 midjourney-v6-review),从标题翻译,不含中文
- **Rating_Overall / Rating_EaseOfUse / Rating_Features**: 0-5 数字,仅工具评测类文章输出
- **Pros / Cons**: 字符串数组,仅工具评测类文章输出,每条一句话
- **Tool_Website**: 工具官网 URL(仅评测类)
- **Tool_Pricing**: 定价简述(仅评测类)
- **ComparisonColumns / ComparisonData**: 横向对比表,仅当文章含多工具对比时输出,规则见下`;

const COMPARISON_SPEC = `横向对比表 JSON 规则:
- 列 JSON(ComparisonColumns)中的 key 必须与数据行(ComparisonData)中的同名字段对应
- 数值/评分字段尽量用数字类型;评分范围为 0-5
- 列定义字段: key, label, type(number|rating|badge|boolean|link|text), higherIsBetter, highlight, align, width(如 "120px")
- 数据行字段: id, name, url, logo(可用 https://logo.clearbit.com/<domain>), 以及与列 key 对应的值
- 示例 ComparisonColumns:
[ { "key": "price", "label": "价格/月(USD)", "type": "number", "higherIsBetter": false, "highlight": true, "align": "right", "width": "120px" }, { "key": "rating", "label": "综合评分", "type": "rating", "higherIsBetter": true, "highlight": true, "align": "center", "width": "120px" } ]
- 示例 ComparisonData:
[ { "id": "t1", "name": "Tool A", "url": "https://a.com", "logo": "https://logo.clearbit.com/a.com", "price": 19, "rating": 4.4 } ]`;

const COVER_SPEC = `coverPrompts: 提取文章主旨,给 3 段文生图提示词,画面比例 16:9(用于生成博客封面图)。要求:
- 每段提示词自成一体,包含主体、风格、构图、光线、色调,可直接投喂 Midjourney/即梦等工具
- 风格彼此有区分度(如 写实摄影/扁平插画/3D渲染),贴合文章主题`;

const TWEET_SPEC = `tweet: 你是一位拥有百万粉丝的 Twitter (X) 资深运营专家,擅长 viral marketing(病毒式营销)。将文章进行"推特化"二创重写,打造下一条爆款推文。
核心原则: 绝对不改变原意,保留核心价值点,但要极大幅度提升阅读体验和传播属性。
结构要求(爆款公式):
1. The Hook (黄金钩子): 首行必须在 3 秒内抓住眼球。使用强烈的观点、反直觉的事实、或 "How-to" 开头。
2. The Meat (干货/正文): 将长段落拆解为简短的单句或 Bullet points (列表)。善用 emoji (🧵, 👉, ✅) 做视觉引导,但不要滥用。
3. The CTA (行动号召): 结尾引导互动(RT, Reply, or Follow),并附上文章链接。
语言风格: 口语化,杜绝 AI 翻译腔。语气要自信、专业且像个真人 (Authentic)。
排版细节: 段落之间必须留空行,确保在手机端阅读舒适。重点词汇可大写或加粗。
输出限制: 推文内容控制在 270 字符以内(不含链接)。链接单独一行放在结尾:
{SITE_LINK}`;

export function buildTrioMessages(articleMarkdown: string, options: TrioPromptOptions) {
  const siteLink = `${options.siteUrl.replace(/\/$/, '')}/zh/blog/{Slug}`;
  const system = [
    '你是一名资深中文科技博客编辑与内容运营专家。分析用户提供的博客文章,输出严格的 JSON(不要输出 JSON 以外的任何文字、不要使用 markdown 代码围栏)。',
    `JSON 结构固定为:\n${TRIO_JSON_SHAPE}`,
    FIELDS_SPEC,
    COMPARISON_SPEC,
    COVER_SPEC,
    TWEET_SPEC.replace('{SITE_LINK}', siteLink),
  ].join('\n\n');

  const user = `文章内容:\n\n${articleMarkdown.slice(0, 24000)}`;

  return [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: user },
  ];
}
