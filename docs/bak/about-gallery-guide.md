# 关于页面 - 代码之外的生活 📸

## 更新概览

"代码之外的生活"部分已经优化完成，新增以下特性：

### ✨ 新功能
1. **图片本地化支持** - 可使用本地图片或远程图片
2. **分类标签** - work / life / inspiration 三种类别
3. **图标标识** - 每张卡片带有 emoji 图标
4. **增强交互** - 悬停效果和动画优化
5. **响应式布局** - 移动端友好的网格布局

---

## 如何替换图片

### 方式一：使用本地图片（推荐）

#### 1. 准备图片
将你的图片放到对应的文件夹：

```
public/images/about/
├── work/           # 工作相关
│   ├── ai-research.jpg
│   ├── testing-tools.jpg
│   ├── community.jpg
│   └── discussion.jpg
├── life/           # 生活爱好
│   └── cafe-thinking.jpg
└── inspiration/    # 灵感来源
    └── learning.jpg
```

#### 2. 更新数据

**英文页面** (`src/app/about/page.tsx`):
```tsx
const galleryItems = [
  {
    src: "https://images.unsplash.com/...", // 保留作为备用
    localSrc: "/images/about/work/ai-research.jpg", // ✅ 使用本地图片
    alt: "Exploring AI technology and future trends",
    caption: "Exploring cutting-edge AI technology",
    category: "work",
    icon: "🤖"
  },
  // ... 其他项目
];
```

**中文页面** (`src/app/zh/about/page.tsx`):
```tsx
const galleryItems = [
  {
    src: "https://images.unsplash.com/...", // 保留作为备用
    localSrc: "/images/about/work/ai-research.jpg", // ✅ 使用本地图片
    alt: "探索AI技术与未来趋势",
    caption: "探索前沿AI技术",
    category: "work",
    icon: "🤖"
  },
  // ... 其他项目
];
```

### 方式二：继续使用远程图片

如果你不想使用本地图片，可以继续使用 Unsplash 或其他图床：

```tsx
{
  src: "https://your-image-url.com/image.jpg",
  // 不设置 localSrc，会自动使用 src
  alt: "Image description",
  caption: "Image caption",
  category: "work",
  icon: "🤖"
}
```

---

## 图片内容建议

### 🖥️ Work - 工作相关
适合展示：
- 实际工作环境照片（可去个人化，只显示设备和屏幕）
- 常用开发工具截图（VS Code、Notion、AI工具界面）
- 技术会议、meetup、演讲照片
- 项目演示或产品截图

**拍摄建议**：
- 保持画面整洁，突出工作元素
- 可以拍摄显示器显示代码、工具界面等
- 避免出现敏感信息（如密码、私人数据）

### ☕ Life - 生活爱好
适合展示：
- 正在阅读的技术书籍封面
- 咖啡店或学习环境
- 运动、摄影等爱好活动
- 旅行或户外活动的风景

**拍摄建议**：
- 保持与个人品牌调性一致
- 可以展示积极向上的生活态度
- 避免过度暴露个人隐私

### 💡 Inspiration - 灵感来源
适合展示：
- Notion/Obsidian 等知识库界面
- 手写笔记或思维导图
- 设计灵感收集（Pinterest、Dribbble 截图）
- 产品原型或设计手稿

**拍摄建议**：
- 突出思考和创意过程
- 可以展示工具和方法论
- 体现专业性和学习能力

---

## 图片规格要求

| 属性 | 推荐值 | 说明 |
|------|--------|------|
| **尺寸** | 800x600px | 4:3 比例，与卡片设计匹配 |
| **文件大小** | < 200KB | 优化加载速度 |
| **格式** | JPG / WebP | WebP 更小但兼容性稍差 |
| **命名规范** | 小写+连字符 | `my-workspace.jpg` ✅<br>`My Workspace.JPG` ❌ |

### 如何优化图片

使用在线工具优化图片大小：
- TinyPNG (https://tinypng.com/)
- Squoosh (https://squoosh.app/)
- ImageOptim (本地工具)

---

## 自定义分类

如果你想添加新的分类或修改现有分类：

### 英文页面
```tsx
category: 'work', // work | life | inspiration
icon: "🤖"        // 自定义 emoji
```

### 中文页面
修改 `categoryNames` 映射：

```tsx
const categoryNames: Record<string, string> = {
  work: '工作',        // 可修改为其他名称
  life: '生活',
  inspiration: '灵感',
  // 可以添加新分类
  travel: '旅行'
};
```

---

## 文案建议

### 副标题 (subtitle)
**英文**: "A blend of work exploration, life inspirations, and continuous learning."
**中文**: "工作探索、生活灵感与持续学习的融合。"

### 底部描述
**英文**:
```tsx
<p className="text-neutral-dark dark:text-dark-neutral-dark text-lg leading-relaxed">
  <strong>Beyond code and reviews</strong>, I'm passionate about exploring the boundaries of AI technology,
  sharing practical experiences with the community, and thinking about how to make complex
  AI tools simple and accessible. I believe true technological innovation should make everyone's life better.
</p>
<p className="text-neutral-medium dark:text-dark-neutral-medium text-base mt-4">
  📚 Currently reading • 🛠️ Testing new tools • 💡 Sharing insights
</p>
```

**中文**:
```tsx
<p className="text-neutral-dark dark:text-dark-neutral-dark text-lg leading-relaxed">
  <strong>除了代码和评测</strong>，我热衷于探索AI技术的边界，与社区分享实践经验，
  并思考如何让复杂的AI工具变得简单易用。我相信，真正的技术创新应该让每个人的生活更美好。
</p>
<p className="text-neutral-medium dark:text-dark-neutral-medium text-base mt-4">
  📚 正在阅读 • 🛠️ 测试新工具 • 💡 分享见解
</p>
```

你可以根据个人情况调整底部 emoji 部分，例如：
- 🎨 正在设计
- 🎵 正在聆听
- 🏃 正在运动
- ✈️ 正在旅行

---

## 样式自定义

所有样式都使用 Tailwind CSS，可以在组件中调整：

### 卡片高度
```tsx
<div className="relative h-56">  {/* 修改 h-56 为其他值 */}
```

### 悬停缩放比例
```tsx
className="... group-hover:scale-110"  {/* scale-110 = 1.1倍 */}
```

### 分类标签样式
```tsx
<div className="absolute top-3 right-3 bg-white/90 dark:bg-dark-bg-primary/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium shadow-sm">
```

---

## 常见问题

### Q: 图片不显示？
A: 检查路径是否正确，本地图片路径必须以 `/` 开头（如 `/images/about/work/test.jpg`）

### Q: 想要更多卡片？
A: 在 `galleryItems` 数组中添加更多对象即可，布局会自动适应

### Q: 想要不同数量的卡片？
A: 目前是 6 张卡片（3x2 网格），可以添加任意数量，Grid 会自动换行

### Q: 如何隐藏分类标签？
A: 移除 `category` 和 `icon` 属性即可

---

## 示例配置

### 极简配置（只用必需字段）
```tsx
{
  src: "/images/about/work/workspace.jpg",
  alt: "My workspace",
  caption: "Where the magic happens"
}
```

### 完整配置（所有字段）
```tsx
{
  src: "https://backup-url.com/image.jpg",
  localSrc: "/images/about/work/workspace.jpg",
  alt: "My workspace with dual monitors",
  caption: "Daily development environment",
  category: "work",
  icon: "💻"
}
```

---

## 下一步建议

1. **准备真实图片** - 根据上述建议拍摄或收集图片
2. **优化图片大小** - 使用 TinyPNG 等工具压缩
3. **上传到项目** - 放入 `public/images/about/` 对应文件夹
4. **更新配置** - 修改两个 About 页面的 `galleryItems` 数组
5. **测试效果** - 运行 `npm run dev` 预览效果

---

## 需要帮助？

如果遇到问题：
1. 检查图片路径和文件名是否正确
2. 查看浏览器控制台是否有错误信息
3. 确保图片文件已正确添加到 `public` 文件夹
4. 运行 `npm run build` 检查是否有构建错误

祝使用愉快！🎉
