import type { Metadata } from 'next';
import Link from 'next/link';
import Section from '@/components/Section';
import SectionHeading from '@/components/SectionHeading';

export const metadata: Metadata = {
  title: 'Disclaimer | MisoTech',
  description:
    'Understand the limitations of MisoTech content, third-party links, and advertising relationships to make informed decisions.',
};

const informationalUsePoints: string[] = [
  'All articles, tutorials, and resources on MisoTech are provided for general information only.',
  'We do not guarantee the completeness, accuracy, or timeliness of the content, though we strive to keep it current.',
  'Any technical decisions, investments, or implementations you undertake are at your own discretion and risk.',
  'Before acting on any insight shared here, consider consulting qualified professionals suited to your specific scenario.',
];

const externalLinkPoints: string[] = [
  'Our articles may reference third-party websites, tools, or resources to enrich your learning experience.',
  'We do not endorse, control, or guarantee the content found on external sites linked from MisoTech.',
  'Visiting external links is at your own risk; please review the third party’s policies and security posture before engaging.',
  'If you discover a broken or harmful link, contact us so we can assess and update it promptly.',
];

const advertisingPoints: string[] = [
  'MisoTech may display contextual advertisements through Google AdSense or collaborate on sponsored content.',
  'Ads and sponsorships help sustain our work but do not influence our editorial judgment or the perspectives we share.',
  'Sponsored content will be clearly identified, and we will always aim for transparency when compensation is involved.',
  'We are not responsible for the claims, offers, or conduct of advertisers—please evaluate them independently.',
];

export default function DisclaimerPage(): JSX.Element {
  return (
    <>
      <Section id="disclaimer-hero" bgColor="bg-neutral-light dark:bg-dark-bg-secondary" padding="py-20 md:py-28">
        <div className="max-w-4xl mx-auto text-center">
          <p className="uppercase tracking-widest text-sm font-semibold text-primary dark:text-dark-primary mb-4">
            Disclaimer
          </p>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-neutral-darker dark:text-dark-neutral-darker mb-6">
            Transparency About Our Content and Partnerships
          </h1>
          <p className="text-lg md:text-xl text-neutral-dark dark:text-dark-neutral-dark">
            Please read this disclaimer to understand the purpose of our content, the nature of outbound links, and how advertising supports MisoTech.
          </p>
        </div>
      </Section>

      <Section id="disclaimer-informational" padding="py-16 md:py-24">
        <SectionHeading
          title="Content Is For Informational Purposes Only"
          subtitle="Use MisoTech insights as a starting point and evaluate them against your unique context."
        />
        <div className="max-w-4xl mx-auto bg-white dark:bg-dark-bg-secondary border border-neutral-light/60 dark:border-dark-neutral-muted/40 rounded-2xl p-8 shadow-sm dark:shadow-neutral-black/10">
          <ul className="space-y-4 list-disc pl-5 text-neutral-dark dark:text-dark-neutral-dark text-base md:text-lg">
            {informationalUsePoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      </Section>

      <Section id="disclaimer-external-links" bgColor="bg-neutral-light dark:bg-dark-bg-secondary">
        <SectionHeading
          title="External Links"
          subtitle="Understand that outbound resources are beyond our direct control."
        />
        <div className="max-w-4xl mx-auto bg-white dark:bg-dark-bg-primary border border-neutral-light/60 dark:border-dark-neutral-muted/40 rounded-2xl p-8 shadow-sm dark:shadow-neutral-black/10">
          <ul className="space-y-4 list-disc pl-5 text-neutral-dark dark:text-dark-neutral-dark text-base md:text-lg">
            {externalLinkPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      </Section>

      <Section id="disclaimer-ads">
        <SectionHeading
          title="Advertising & Sponsorships"
          subtitle="How we collaborate with partners while maintaining editorial independence."
        />
        <div className="max-w-4xl mx-auto bg-white dark:bg-dark-bg-secondary border border-neutral-light/60 dark:border-dark-neutral-muted/40 rounded-2xl p-8 shadow-sm dark:shadow-neutral-black/10">
          <ul className="space-y-4 list-disc pl-5 text-neutral-dark dark:text-dark-neutral-dark text-base md:text-lg">
            {advertisingPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      </Section>

      <Section id="disclaimer-contact" bgColor="bg-neutral-light dark:bg-dark-bg-secondary">
        <SectionHeading
          title="Questions or Concerns?"
          subtitle="We welcome feedback that helps us keep this disclaimer accurate and useful."
        />
        <div className="max-w-4xl mx-auto text-neutral-dark dark:text-dark-neutral-dark text-base md:text-lg space-y-6">
          <p>
            If you have questions about this disclaimer or wish to report a concern, please email
            <a href="mailto:1479333689@qq.com" className="text-primary dark:text-dark-primary font-medium ml-2">1479333689@qq.com</a>
            or reach out via our <Link href="/contact" className="text-primary dark:text-dark-primary underline">contact page</Link>.
          </p>
          <p className="text-sm text-neutral-medium dark:text-dark-neutral-medium uppercase tracking-wide">
            Last updated: {new Date().toISOString().split('T')[0]}
          </p>
        </div>
      </Section>
    </>
  );
}
