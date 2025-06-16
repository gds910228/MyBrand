import { ReactNode } from 'react';
import { Inter, Montserrat, Fira_Code } from 'next/font/google';
import { Metadata } from 'next';
import ThemeProvider from '@/components/ThemeProvider';
import '@/styles/globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// 字体配置
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fira-code',
});

export const metadata: Metadata = {
  title: 'John Doe - Full Stack Developer & Designer',
  description: 'Personal portfolio and blog of John Doe, a Full Stack Developer and Designer.',
};

// 支持的语言
const locales = ['en', 'zh'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function RootLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} ${montserrat.variable} ${firaCode.variable} font-sans`}>
        <ThemeProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
} 