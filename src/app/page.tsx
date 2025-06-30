import { redirect } from 'next/navigation';
import { defaultLocale } from '@/i18n/locales';
import Hero from '@/components/Hero';
import FeaturedProjects from '@/components/FeaturedProjects';
import LatestPosts from '@/components/LatestPosts';
import ContactCTA from '@/components/ContactCTA';

// 重定向到默认语言的首页
export default function HomePage() {
  return (
    <>
      <Hero
        title="MisoTech"
        subtitle="Decode the Stack"
        ctaText="View Our Solutions"
        ctaLink="/projects"
        imageSrc="/images/hero-image.jpg" 
        imageAlt="MisoTech - Professional Technology Solutions" 
      />
      <FeaturedProjects locale="en" />
      <LatestPosts locale="en" />
      <ContactCTA 
        padding="py-24"
      />
    </>
  );
} 