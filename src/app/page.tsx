import { defaultLocale } from '@/i18n/locales';
import FeaturedProjects from '@/components/FeaturedProjects';
import LatestPosts from '@/components/LatestPosts';
import Hero from '@/components/Hero';
import ContactCTA from '@/components/ContactCTA';

// ISR 缓存配置：每5分钟重新验证一次，确保获取最新的Notion签名URL
// Notion的AWS签名URL通常在几小时内过期，使用较短的revalidate时间确保URL及时更新
export const revalidate = 300;

export default function HomePage() {
  return (
    <>
      <Hero
        title="MisoTech"
        subtitle="Decode the Stack"
        ctaText="View Our Solutions"
        ctaLink="/projects"
        imageSrc="/images/hero-image.jpg"
        imageAlt="MisoTech - Professional Tech Solutions"
      />
      <FeaturedProjects locale={defaultLocale} />
      <LatestPosts locale={defaultLocale} />
      <ContactCTA
        padding="py-24"
      />
    </>
  );
} 