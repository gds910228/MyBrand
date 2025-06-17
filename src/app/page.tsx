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
        title="Hi, I'm John Doe"
        subtitle="Full Stack Developer & Designer"
        ctaText="View My Work"
        ctaLink="/projects"
        imageSrc="/images/hero-image.jpg" 
        imageAlt="John Doe, Full Stack Developer" 
      />
      <FeaturedProjects locale="en" />
      <LatestPosts locale="en" />
      <ContactCTA 
        padding="py-24"
      />
    </>
  );
} 