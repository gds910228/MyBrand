import React from 'react';
import type { Metadata } from 'next';
import ServicesPageContent from '@/components/ServicesPageContent';

export const metadata: Metadata = {
  title: 'Services · MisoTech',
  description:
    'AI application engineering, enterprise system build, product MVP & launch, and technical advisory — by an ex-Big-Tech senior engineer with Fortune 500 client background.',
};

export default function ServicesPage() {
  return <ServicesPageContent locale="en" />;
}
