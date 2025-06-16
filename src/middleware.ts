import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 支持的语言
const locales = ['en', 'zh']
const defaultLocale = 'en'

// 匹配除静态资源外的所有路由
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了:
     * - 以 /api/ 开头的路径
     * - 以 /_next/ 开头的路径
     * - 以 .*** 结尾的静态资源路径
     */
    '/((?!api|_next|.*\\..*).*)',
  ],
}

// 语言中间件
export function middleware(request: NextRequest) {
  // 获取请求路径名
  const pathname = request.nextUrl.pathname

  // 为了防止循环重定向，我们先检查是否已经处理过此请求
  const isRedirected = request.headers.get('x-redirected');
  if (isRedirected) return NextResponse.next();
  
  // 检查请求路径是否已包含支持的语言
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  )

  // 如果路径已包含语言代码，则不做任何处理
  if (!pathnameIsMissingLocale) {
    return NextResponse.next()
  }

  // 获取用户首选语言，或使用默认语言
  const preferredLocale = request.headers.get('accept-language')?.split(',')[0]?.split('-')[0] || defaultLocale
  const locale = locales.includes(preferredLocale) ? preferredLocale : defaultLocale
  
  // 仅当用户首选语言为中文时，重定向到/zh路径
  // 否则使用默认路径（不添加/en前缀）
  if (locale === 'zh' && preferredLocale === 'zh') {
    // 克隆请求URL
    const newUrl = request.nextUrl.clone()
    // 构建新的路径
    newUrl.pathname = `/zh${pathname === '/' ? '' : pathname}`
    
    // 添加标记以防止循环重定向
    const response = NextResponse.redirect(newUrl)
    response.headers.set('x-redirected', '1')
    
    return response
  }

  return NextResponse.next()
} 