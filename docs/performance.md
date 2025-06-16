# 性能优化文档

## 已实施的性能优化措施

### 1. 图片优化

- **图片格式优化**：配置Next.js使用WebP格式，相比JPEG和PNG可减少25-80%的文件大小
  ```javascript
  images: {
    formats: ['image/webp'],
  }
  ```

- **响应式图片**：配置不同设备尺寸的图片大小，确保用户只下载适合其设备的图片尺寸
  ```javascript
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  }
  ```

- **懒加载**：使用Next.js的Image组件自动实现图片懒加载，只有当图片进入视口时才加载

- **图片CDN**：使用Unsplash等图片CDN服务，利用其全球分布的服务器网络加速图片加载

### 2. 代码分割

- **自动代码分割**：Next.js默认会按页面自动进行代码分割，只加载当前页面所需的JavaScript

- **动态导入**：使用React的`dynamic`导入组件，实现按需加载
  ```javascript
  import dynamic from 'next/dynamic';
  
  const DynamicComponent = dynamic(() => import('../components/HeavyComponent'), {
    loading: () => <p>Loading...</p>,
    ssr: false // 如果组件不需要服务端渲染
  });
  ```

- **优化包导入**：配置`optimizePackageImports`选项，自动优化大型库的导入
  ```javascript
  optimizePackageImports: [
    'react-icons',
    '@fortawesome/fontawesome-svg-core',
    '@fortawesome/free-brands-svg-icons',
    '@fortawesome/free-solid-svg-icons',
    '@fortawesome/react-fontawesome'
  ]
  ```

### 3. 缓存策略

- **静态页面生成**：配置`output: 'standalone'`，生成静态HTML文件，可以被CDN缓存

- **SWC编译器优化**：启用`swcMinify: true`，使用Rust编写的SWC编译器替代Terser进行代码压缩，提升构建速度

- **浏览器缓存**：配置适当的缓存控制头，使静态资源在浏览器中缓存

- **CSS优化**：启用实验性的CSS内联和优化功能
  ```javascript
  experimental: {
    inlineCss: true,
    optimizeCss: true,
  }
  ```

### 4. 其他优化

- **Gzip压缩**：启用`compress: true`，对服务器响应进行Gzip压缩，减少传输数据量

- **移除生产环境console语句**：配置编译器选项移除生产环境中的console.log语句
  ```javascript
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  }
  ```

- **字体优化**：使用Next.js的字体优化功能，实现字体文件的预加载和优化

## 性能测量与监控

### 性能指标

- **First Contentful Paint (FCP)**: < 1.8秒
- **Largest Contentful Paint (LCP)**: < 2.5秒
- **First Input Delay (FID)**: < 100毫秒
- **Cumulative Layout Shift (CLS)**: < 0.1

### 监控工具

- **Lighthouse**: 用于测量页面性能、SEO、可访问性和最佳实践
- **Web Vitals**: 监控核心Web指标
- **Next.js Analytics**: 如果部署在Vercel上，可使用内置的分析工具

## 未来优化计划

1. **实现Service Worker**: 添加离线功能和资源缓存
2. **预取链接**: 实现用户可能点击的链接的预取
3. **进一步优化字体加载**: 实现字体子集化，只加载必要的字符
4. **实现流式SSR**: 利用React 18的Streaming SSR功能
5. **优化第三方脚本**: 延迟加载非关键的第三方脚本 