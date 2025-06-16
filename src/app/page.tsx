import { redirect } from 'next/navigation';
import { defaultLocale } from '@/i18n/locales';

// 重定向到默认语言的首页
export default function RootPage() {
  redirect(`/${defaultLocale}`);
} 