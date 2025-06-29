"use client";

import '../styles/globals.css';
import { Inter, Montserrat, Fira_Code } from 'next/font/google';
import React from 'react';
import ThemeProvider from '@/components/ThemeProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
});

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
  weight: ['500', '600', '700', '800'],
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fira-code',
  weight: ['400', '500'],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable} ${firaCode.variable}`}>
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4217180014733990"
          crossOrigin="anonymous"></script>
      </head>
      <body className="min-h-screen flex flex-col antialiased text-neutral-dark dark:text-dark-neutral-dark bg-white dark:bg-dark-bg-primary transition-colors duration-200">
        <ThemeProvider>
          <Navbar />
          <main className="flex-grow pt-20">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
} 