"use client";

import React, { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import ThemeProvider from '@/components/ThemeProvider';

interface ClientProvidersProps {
  locale: string;
  messages: any;
  children: ReactNode;
}

export default function ClientProviders({ locale, messages, children }: ClientProvidersProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </NextIntlClientProvider>
  );
} 