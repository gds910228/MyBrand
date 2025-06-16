# 暗黑模式功能实现文档

## 功能概述

暗黑模式是一种用户界面设计选项，可以降低屏幕亮度，减少眼睛疲劳，并在低光环境中提供更好的阅读体验。本文档记录了在品牌网站项目中实现暗黑模式的详细过程和技术细节。

## 实现方案

### 1. Tailwind CSS 配置

使用 Tailwind CSS 的 `darkMode: 'class'` 策略，通过在 HTML 根元素上添加 `dark` 类来切换暗黑模式。

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  // ...其他配置
}
```

### 2. 暗黑模式颜色主题设计

为暗黑模式定义了一套专用的颜色方案，包括：

- 主色调：蓝色系列，保持与亮色模式一致但调整亮度
- 背景色：深色背景，采用深蓝灰色系
- 文本颜色：浅色文本，确保在深色背景上有足够对比度
- 中性色：反转亮色模式的中性色，确保层次感

```javascript
// 暗黑模式颜色示例
dark: {
  primary: {
    light: '#93c5fd',
    DEFAULT: '#3b82f6',
    dark: '#2563eb',
  },
  neutral: {
    white: '#0f172a',
    light: '#1e293b',
    muted: '#64748b',
    medium: '#94a3b8',
    dark: '#e2e8f0',
    darker: '#f1f5f9',
    black: '#ffffff',
  },
  bg: {
    primary: '#0f172a',
    secondary: '#1e293b',
  },
}
```

### 3. 主题切换组件

创建了 `ThemeToggle` 组件，用于切换亮色和暗黑模式：

- 使用 React 状态管理主题状态
- 通过 localStorage 持久化用户的主题偏好
- 支持系统偏好检测（通过 `prefers-color-scheme` 媒体查询）
- 提供直观的切换按钮，显示太阳/月亮图标

### 4. 主题持久化存储

使用 localStorage 存储用户的主题偏好，确保用户在下次访问时保持相同的主题设置：

```javascript
// 保存主题设置
localStorage.setItem('theme', theme);

// 读取主题设置
const savedTheme = localStorage.getItem('theme');
```

### 5. 组件适配

更新了以下组件以支持暗黑模式：

- Layout：根布局组件，处理初始主题设置
- Navbar：导航栏，包含主题切换按钮
- Footer：页脚组件
- Container：容器组件
- Section：区块组件
- SectionHeading：标题组件

## 使用示例

```jsx
// 在组件中使用暗黑模式样式
<div className="bg-white dark:bg-dark-bg-primary text-neutral-dark dark:text-dark-neutral-dark">
  暗黑模式适配的内容
</div>
```

## 最佳实践

1. **避免硬编码颜色**：始终使用 Tailwind 类名而非硬编码的颜色值
2. **考虑对比度**：确保文本和背景之间有足够的对比度
3. **平滑过渡**：添加过渡效果使主题切换更加平滑
4. **考虑图片**：为暗黑模式调整图片亮度或提供替代图片
5. **测试**：在不同设备和浏览器上测试暗黑模式

## 未来改进

1. 添加更多主题选项（如蓝色主题、绿色主题等）
2. 改进主题切换的动画效果
3. 为图片和图标提供暗黑模式专用版本
4. 优化暗黑模式下的阅读体验 