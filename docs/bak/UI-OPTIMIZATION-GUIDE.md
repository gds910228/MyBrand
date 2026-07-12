# UI优化使用指南

本文档介绍新增的UI组件和优化功能的使用方法。

## 📦 新增组件

### 1. Toast 通知系统

#### 安装配置

在根布局 (`layout.tsx`) 中包裹 `ToastProvider`:

```tsx
import { ToastProvider } from '@/components/ToastContainer';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ToastProvider position="top-right" maxToasts={5}>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
```

#### 使用方法

```tsx
import { useToast } from '@/components/ToastContainer';

function MyComponent() {
  const toast = useToast();

  const handleClick = () => {
    // 显示不同类型的 Toast
    toast.success('操作成功！');
    toast.error('发生错误，请重试');
    toast.warning('请注意这个警告');
    toast.info('这是一条提示信息');

    // 自定义持续时间 (毫秒)
    toast.success('将在10秒后消失', 10000);
  };

  return <button onClick={handleClick}>显示通知</button>;
}
```

### 2. Modal 对话框

```tsx
import Modal, { ModalFooter } from '@/components/Modal';
import { useState } from 'react';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>打开对话框</button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="对话框标题"
        size="md" // xs | sm | md | lg | xl | full
        showCloseButton={true}
        closeOnOverlayClick={true}
      >
        <p>这是对话框内容</p>

        <ModalFooter>
          <button onClick={() => setIsOpen(false)}>取消</button>
          <button onClick={() => setIsOpen(false)}>确认</button>
        </ModalFooter>
      </Modal>
    </>
  );
}
```

### 3. Skeleton 加载状态

```tsx
import {
  Skeleton,
  CardSkeleton,
  BlogCardSkeleton,
  HeroSkeleton,
  TextSkeleton,
  FormSkeleton,
  TableSkeleton,
  ListSkeleton
} from '@/components/Skeleton';

// 基础骨架屏
<Skeleton variant="text" width="100%" height="20px" />
<Skeleton variant="circular" width="40px" height="40px" />
<Skeleton variant="rounded" width="100%" height="200px" />

// 卡片骨架屏
<CardSkeleton />

// 博客卡片骨架屏
<BlogCardSkeleton />

// Hero区域骨架屏
<HeroSkeleton />

// 多行文本骨架屏
<TextSkeleton lines={3} />

// 表单骨架屏
<FormSkeleton fields={4} />

// 表格骨架屏
<TableSkeleton rows={5} cols={4} />

// 列表骨架屏
<ListSkeleton items={5} />
```

### 4. 页面过渡动画

```tsx
import PageTransition from '@/components/PageTransition';

export default function Page() {
  return (
    <PageTransition type="fade"> {/* fade | slideUp | scale | slideIn */}
      <div>页面内容</div>
    </PageTransition>
  );
}
```

### 5. 滚动显现动画

```tsx
import ScrollReveal, { StaggerContainer, StaggerItem } from '@/components/ScrollReveal';

// 单个元素滚动显现
<ScrollReveal direction="up" delay={100}>
  <h1>标题</h1>
</ScrollReveal>

// 容器子元素交错动画
<StaggerContainer staggerDelay={100}>
  <StaggerItem><div>项目1</div></StaggerItem>
  <StaggerItem><div>项目2</div></StaggerItem>
  <StaggerItem><div>项目3</div></StaggerItem>
</StaggerContainer>
```

### 6. 增强的 Button 组件

```tsx
import Button from '@/components/Button';

// 基础按钮
<Button variant="solid" size="md">
  点击我
</Button>

// 带图标
<Button
  icon={<Icon />}
  iconPosition="left"
>
  带图标
</Button>

// 全宽按钮
<Button fullWidth>
  全宽按钮
</Button>
```

## 🎨 优化的组件

### Hero 组件新增功能

```tsx
<Hero
  title="第一行标题 | 第二行标题"
  subtitle="副标题"
  ctaText="主要按钮"
  ctaLink="/path"
  secondaryCtaText="次要按钮"
  secondaryCtaLink="/path"
  imageSrc="/image.jpg"
  imageAlt="图片描述"
  useGradientTitle={true} // 启用渐变标题效果
/>
```

**新特性：**
- ✨ 动态背景渐变球动画
- 🎭 渐变文字标题支持（使用 `|` 分行）
- 📱 优化的移动端布局
- 🎨 改进的悬停效果
- 💫 流畅的入场动画

### 卡片组件统一

**BlogCard** 和 **ProjectCard** 现在具有统一的设计：

- ✅ 毛玻璃效果 (`.glass-surface`)
- ✅ 统一的悬停动画
- ✅ 图片缩放效果
- ✅ 一致的圆角和阴影
- ✅ 使用动画常量

## 🎬 设计系统工具

### 动画常量 (`/src/styles/animations.ts`)

```typescript
import { motion, transitions, duration, easing } from '@/styles/animations';

// 使用预设过渡
transition('opacity, transform', 'default') // "opacity, transform 200ms cubic-bezier(0.4, 0, 0.2, 1)"

// Framer Motion 预设
<motion.div {...motion.fade} />
<motion.div {...motion.slideUp} />
<motion.div {...motion.scale} />
```

### 阴影系统 (`/src/styles/shadows.ts`)

```typescript
import { shadows, neonGlows, getShadow } from '@/styles/shadows';

// 获取主题对应的阴影
const shadow = getShadow('md', isDark); // md: medium shadow

// 霓虹发光效果
const glow = neonGlows.cyan.dark;
```

## 🌐 全局CSS类

### 新增实用类

```css
/* 卡片悬停效果 */
.card-hover

/* 图片缩放容器 */
.img-zoom-container

/* 渐变文字 */
.gradient-text

/* 加载闪烁效果 */
.shimmer

/* 脉冲发光 */
.pulse-glow

/* 淡入动画 */
.fade-in

/* 上滑动画 */
.slide-up

/* 平滑滚动 */
.smooth-scroll
```

## 📝 最佳实践

### 1. 加载状态

```tsx
// 在数据加载时显示 Skeleton
const [loading, setLoading] = useState(true);

return (
  <>
    {loading ? (
      <BlogCardSkeleton />
    ) : (
      <BlogCard {...blogData} />
    )}
  </>
);
```

### 2. 用户体验反馈

```tsx
// 在表单提交后显示反馈
const handleSubmit = async () => {
  try {
    await submitForm();
    toast.success('提交成功！');
  } catch (error) {
    toast.error('提交失败，请重试');
  }
};
```

### 3. 页面切换动画

```tsx
// 在 layout.tsx 中包裹页面内容
<PageTransition type="slideUp">
  {children}
</PageTransition>
```

### 4. 内容滚动显现

```tsx
// 让内容在滚动时优雅地出现
<ScrollReveal direction="up" delay={0}>
  <Section />
</ScrollReveal>
```

## 🎯 优化建议

### 性能优化

1. **懒加载**: 使用 `viewport={{ once: true }}` 确保动画只播放一次
2. **减少重渲染**: Toast 和 Modal 使用 Context 避免不必要的重渲染
3. **代码分割**: 新组件都是独立的，可以按需导入

### 可访问性

1. **键盘导航**: Modal 支持 ESC 键关闭
2. **ARIA 标签**: 所有交互元素都有适当的标签
3. **焦点管理**: Modal 打开时自动管理焦点

### 一致性

1. **使用设计令牌**: 所有动画使用统一的时长和缓动函数
2. **组件变体**: 遵循既定的 size、variant 模式
3. **主题支持**: 所有组件都支持深色模式

## 🔄 迁移指南

### 从旧版本 Button 迁移

```tsx
// 旧版本
<Button>点击</Button>

// 新版本（完全兼容）
<Button>点击</Button>

// 新版本（使用新功能）
<Button icon={<Icon />} fullWidth>
  点击
</Button>
```

### 从旧版本 Hero 迁移

```tsx
// 旧版本（仍然支持）
<Hero title="标题" {...props} />

// 新版本（启用渐变）
<Hero title="标题1 | 标题2" useGradientTitle={true} {...props} />
```

## 📚 相关文件

```
src/
├── components/
│   ├── Button.tsx          # 增强的按钮组件
│   ├── Hero.tsx            # 优化的 Hero 组件
│   ├── BlogCard.tsx        # 优化的博客卡片
│   ├── ProjectCard.tsx     # 优化的项目卡片
│   ├── Toast.tsx           # Toast 通知组件
│   ├── ToastContainer.tsx  # Toast Provider
│   ├── Modal.tsx           # Modal 对话框组件
│   ├── Skeleton.tsx        # Skeleton 加载组件
│   ├── PageTransition.tsx  # 页面过渡动画
│   └── ScrollReveal.tsx    # 滚动显现动画
├── styles/
│   ├── animations.ts       # 动画设计令牌
│   ├── shadows.ts          # 阴影设计令牌
│   └── globals.css         # 全局样式和实用类
└── app/
    └── layout.tsx          # 根布局（添加 ToastProvider）
```

## 🎨 效果预览

所有优化都遵循以下设计原则：

- **一致性**: 统一的动画时长、缓动函数、阴影级别
- **性能**: 使用 CSS 变换和 Framer Motion 的优化
- **可访问**: 键盘导航、屏幕阅读器支持
- **响应式**: 在所有设备上都有良好体验
- **美观**: 现代化的设计语言和流畅的动画

## 🚀 开始使用

1. 在根布局中添加 `ToastProvider`
2. 导入需要的组件
3. 使用 `useToast` hook 显示通知
4. 用 `PageTransition` 包裹页面内容
5. 用 `ScrollReveal` 添加滚动动画
6. 用 `Skeleton` 显示加载状态
7. 用 `Modal` 创建对话框

享受全新的 UI 体验！ 🎉
