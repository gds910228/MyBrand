import { defaultLocale } from '@/i18n/locales';
import FeaturedProjects from '@/components/FeaturedProjects';
import LatestPosts from '@/components/LatestPosts';
import Hero from '@/components/Hero';
import ContactCTA from '@/components/ContactCTA';

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