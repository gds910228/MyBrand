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
        title="Ship AI Products. | Not Just Demos."
        subtitle="Archer — ex-Big-Tech senior engineer with 10+ years of full-stack delivery for Fortune 500 retail / automotive / QSR clients. Now solo, building AI applications, enterprise systems, and product MVPs."
        ctaText="Hire Me →"
        ctaLink="/services"
        secondaryCtaText="See Case Studies"
        secondaryCtaLink="/projects"
        imageSrc="/images/hero-image.jpg"
        imageAlt="MisoTech — Available for Hire"
        stats={[
          { value: '10+', label: 'YEARS SHIPPING', color: 'orange' },
          { value: 'F500', label: 'CLIENT BACKGROUND', color: 'blue' },
          { value: 'AI', label: 'FIRST ARCHITECTURE', color: 'green' },
        ]}
      />
      <FeaturedProjects locale={defaultLocale} />
      <LatestPosts locale={defaultLocale} />
      <ContactCTA
        padding="py-24"
      />
    </>
  );
}
