import { defaultLocale } from '@/i18n/locales';
import FeaturedProjects from '@/components/FeaturedProjects';
import LatestPosts from '@/components/LatestPosts';
import Hero from '@/components/Hero';
import ContactCTA from '@/components/ContactCTA';

// ISR 缓存配置：每 60 秒重新验证一次。
// 首页底部 LatestPosts 是 Server Component，吃这里的 revalidate；
// 旧值 300 会让新文章发布后最多 5 分钟才出现。1 分钟窗口足够及时，
// 同时把 Notion API 调用频率限制在每分钟最多一次（每语言）。
export const revalidate = 60;

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
