"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import Hero from '@/components/Hero';
import FeaturedProjects from '@/components/FeaturedProjects';
import LatestPosts from '@/components/LatestPosts';
import ContactCTA from '@/components/ContactCTA';

export default function Home() {
  const t = useTranslations('home');
  
  return (
    <>
      <Hero
        title={t('hero.title')}
        subtitle={t('hero.description')}
        ctaText={t('hero.cta')}
        ctaLink="/projects"
        secondaryCtaText={t('contactCTA.button')}
        secondaryCtaLink="/contact"
        imageSrc="https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1172&q=80"
        imageAlt="Developer working on code"
      />
      
      <FeaturedProjects />
      
      <LatestPosts />
      
      <ContactCTA />
    </>
  );
} 