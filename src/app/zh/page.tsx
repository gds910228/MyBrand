import Hero from '@/components/Hero';
import FeaturedProjects from '@/components/FeaturedProjects';
import LatestPosts from '@/components/LatestPosts';
import ContactCTA from '@/components/ContactCTA';

// ISR 缓存配置：每 60 秒重新验证一次。
// 不加这个的话，整页会被 Next.js 静态化，部署后 LatestPosts 永远不更新。
// 必须和 /src/app/page.tsx 保持一致。
export const revalidate = 60;

export default function ZhHomePage() {
  return (
    <>
      <Hero
        title="让 AI 真正落地， | 而不只是停留在 Demo"
        subtitle="Archer——前大厂高级工程师，10+ 年全栈交付经验，曾为多家世界 500 强零售、汽车、餐饮客户主导核心业务系统。现独立开发者，专注 AI 应用、企业系统与产品 MVP。"
        ctaText="立即合作 →"
        ctaLink="/zh/services"
        secondaryCtaText="查看案例"
        secondaryCtaLink="/zh/projects"
        imageSrc="/images/hero-image.jpg"
        imageAlt="MisoTech — 接单中"
        stats={[
          { value: '10+', label: '年交付经验', color: 'orange' },
          { value: 'F500', label: '世界 500 强背景', color: 'blue' },
          { value: 'AI', label: '优先架构', color: 'green' },
        ]}
      />
      <FeaturedProjects locale="zh" />
      <LatestPosts locale="zh" />
      <ContactCTA
        padding="py-24"
      />
    </>
  );
}
