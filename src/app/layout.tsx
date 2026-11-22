"use client";

import '../styles/globals.css';
import localFont from 'next/font/local';
import React from 'react';
import ThemeProvider from '@/components/ThemeProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// 自托管字体（替代 next/font/google）：
// 1) next/font/google 构建期要从 fonts.googleapis.com 下载，本机网络会卡死构建；
// 2) 国内访客加载 Google Fonts CSS 也被墙，自托管更稳。
// 文件来自 @fontsource 包（latin 子集，与原 next/font/google 配置同字重）。
const syne = localFont({
  src: [
    { path: '../fonts/syne-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/syne-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/syne-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/syne-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../fonts/syne-latin-800-normal.woff2', weight: '800', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-syne',
});

const spaceGrotesk = localFont({
  src: [
    { path: '../fonts/space-grotesk-latin-300-normal.woff2', weight: '300', style: 'normal' },
    { path: '../fonts/space-grotesk-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/space-grotesk-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/space-grotesk-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/space-grotesk-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-space-grotesk',
});

const ibmPlexMono = localFont({
  src: [
    { path: '../fonts/ibm-plex-mono-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/ibm-plex-mono-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/ibm-plex-mono-latin-600-normal.woff2', weight: '600', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-ibm-plex-mono',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${syne.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable}`}>
      <head>
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-TWYKG79FX0"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-TWYKG79FX0');
          `
        }} />
        
        {/* Theme initialization */}
        <script dangerouslySetInnerHTML={{ __html: `!function(){try{var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}}();` }} />
        
        {/* Google AdSense */}
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4217180014733990"
          crossOrigin="anonymous"></script>
      </head>
      <body className="min-h-screen flex flex-col antialiased text-neutral-dark dark:text-metallic bg-white dark:bg-deep-charcoal transition-colors duration-200">
        <ThemeProvider>
          <Navbar />
          <main className="flex-grow pt-20">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
} 