/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com'],
    // 图片优化配置
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
  },
  // 启用gzip压缩
  compress: true,
  // 启用React编译器
  compiler: {
    // 删除console.log语句
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // 启用SWC压缩
  swcMinify: true,
  // 优化导入包
  optimizePackageImports: [
    'react-icons',
    '@fortawesome/fontawesome-svg-core',
    '@fortawesome/free-brands-svg-icons',
    '@fortawesome/free-solid-svg-icons',
    '@fortawesome/react-fontawesome'
  ],
  // 启用静态页面生成
  output: 'standalone',
  // 启用Brotli压缩
  experimental: {
    // 启用CSS内联
    inlineCss: true,
    // 启用代码分割
    optimizeCss: true,
  },
};

module.exports = nextConfig; 