import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './src/i18n/locales';

// 创建国际化中间件
export default createMiddleware({
  // 支持的语言列表
  locales,
  // 默认语言
  defaultLocale,
  // 使用路径前缀进行本地化
  localePrefix: 'always'
});

export const config = {
  // 匹配除了以下路径之外的所有路径:
  // - 所有API路由 (/api/*)
  // - 所有静态资源 (/_next/*, /fonts/*, /images/*)
  // - 所有静态文件 (/favicon.ico, /site.webmanifest, 等)
  matcher: ['/((?!api|_next|fonts|images|.*\\..*).*)']
}; 