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
  // 启用静态页面生成
  output: 'standalone',
};

module.exports = nextConfig; 