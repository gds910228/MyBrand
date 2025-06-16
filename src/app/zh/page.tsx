import Hero from '@/components/Hero';
import FeaturedProjects from '@/components/FeaturedProjects';
import LatestPosts from '@/components/LatestPosts';
import ContactCTA from '@/components/ContactCTA';

export default function ZhHomePage() {
  return (
    <>
      <Hero
        title="你好，我是 John Doe"
        subtitle="全栈开发工程师 & 设计师"
        ctaText="查看我的作品"
        ctaLink="/projects"
        imageSrc="/images/hero-image.jpg" 
        imageAlt="John Doe，全栈开发工程师" 
      />
      <FeaturedProjects />
      <LatestPosts />
      <ContactCTA 
        padding="py-24"
      />
    </>
  );
} 