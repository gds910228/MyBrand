import Hero from '@/components/Hero';
import FeaturedProjects from '@/components/FeaturedProjects';
import LatestPosts from '@/components/LatestPosts';
import ContactCTA from '@/components/ContactCTA';

export default function ZhHomePage() {
  return (
    <>
      <Hero
        title="MisoTech"
        subtitle="解码技术栈"
        ctaText="查看我们的解决方案"
        ctaLink="/zh/projects"
        imageSrc="/images/hero-image.jpg" 
        imageAlt="MisoTech - 专业技术解决方案" 
      />
      <FeaturedProjects locale="zh" />
      <LatestPosts locale="zh" />
      <ContactCTA 
        padding="py-24"
      />
    </>
  );
} 