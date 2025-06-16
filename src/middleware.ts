import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 支持的语言
const locales = ['en', 'zh']
const defaultLocale = 'en'

// 语言中间件
export function middleware(request: NextRequest) {
  // 获取请求路径名
  const pathname = request.nextUrl.pathname
  
  // 获取用户首选语言
  const preferredLocale = request.headers.get('accept-language')?.split(',')[0]?.split('-')[0] || defaultLocale
  
  // 检查请求路径是否已包含支持的语言
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  // 如果路径已包含语言代码，则不做任何处理
  if (pathnameHasLocale) return

  // 如果URL中没有语言代码，则根据浏览器语言设置重定向
  const locale = locales.includes(preferredLocale) ? preferredLocale : defaultLocale
  
  // 构建需要重定向到的新URL
  // 中文用户重定向到 /zh 开头的路径，英文用户保持原路径
  if (locale === 'zh') {
    request.nextUrl.pathname = `/zh${pathname === '/' ? '' : pathname}`
    return NextResponse.redirect(request.nextUrl)
  }

  return NextResponse.next()
} 