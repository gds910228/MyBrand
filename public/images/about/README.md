# About Page Gallery Images

## Directory Structure

```
public/images/about/
├── work/           # 工作相关图片
│   ├── workspace.jpg
│   ├── coding.jpg
│   └── tools.jpg
├── life/           # 生活爱好图片
│   ├── reading.jpg
│   ├── coffee.jpg
│   └── sports.jpg
└── inspiration/    # 灵感来源图片
    ├── notes.jpg
    ├── brainstorm.jpg
    └── resources.jpg
```

## Image Guidelines

### Work Category
- 工作台照片（可去个人化，只显示设备和环境）
- 常用工具截图（IDE、Notion、AI工具界面）
- 技术会议或分享照片

### Life Category
- 书籍封面（正在阅读的技术书籍）
- 爱好活动照片（摄影、运动等）
- 咖啡店或学习环境

### Inspiration Category
- 知识库或笔记截图
- 设计灵感收集
- 产品原型或手稿

## Image Specifications
- **Recommended size**: 800x600px (4:3 aspect ratio)
- **File format**: JPG or WebP
- **File size**: < 200KB per image
- **Naming**: Use lowercase with hyphens (e.g., `my-workspace.jpg`)

## How to Update Images

1. Place your images in the appropriate folder above
2. Update the image paths in `/src/app/about/page.tsx` and `/src/app/zh/about/page.tsx`
3. Update the corresponding captions in the `galleryItems` array

Example:
```tsx
<GalleryItem
  src="/images/about/work/workspace.jpg"
  alt="我的工作台"
  caption="日常开发环境"
  category="work"
/>
```
