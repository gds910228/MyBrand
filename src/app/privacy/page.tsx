import type { Metadata } from 'next';
import Link from 'next/link';
import Section from '@/components/Section';
import SectionHeading from '@/components/SectionHeading';

export const metadata: Metadata = {
  title: 'Privacy Policy | MisoTech',
  description:
    'Learn how MisoTech collects, uses, and protects your personal information, with full transparency into data rights and third-party advertising cookies.',
};

const informationWeCollect: Array<{
  title: string;
  description: string;
  bulletPoints: string[];
}> = [
  {
    title: 'Information You Provide Voluntarily',
    description:
      'Details you choose to share with us when you interact with the site or contact us directly.',
    bulletPoints: [
      'Contact information such as your name, email address, company, and role when you submit a form or send us an email.',
      'Project requirements, feedback, or any other message body you include in contact or consultation requests.',
      'Optional profile details when subscribing to newsletters or gated resources (if you opt in).',
    ],
  },
  {
    title: 'Information Collected Automatically',
    description:
      'Technical data gathered through analytics tools to help us understand how visitors use the site.',
    bulletPoints: [
      'IP address, approximate location, browser type, operating system, and device information.',
      'Pages visited, time on page, referring URLs, scroll depth, and other engagement metrics.',
      'Aggregated performance metrics such as load times and error reports to improve site reliability.',
    ],
  },
  {
    title: 'Cookies and Similar Technologies',
    description:
      'Small data files stored on your device that support core functionality and personalized experiences.',
    bulletPoints: [
      'Essential cookies required to maintain session state, security, and language preferences.',
      'Analytics cookies from Google Analytics and Vercel Analytics that help us measure traffic patterns.',
      'Advertising cookies set by Google AdSense to deliver relevant ads and limit repetitive impressions.',
    ],
  },
];

const waysWeUseInformation: string[] = [
  'Responding to inquiries, proposals, and collaboration requests that you initiate.',
  'Delivering tailored content, updates, newsletters, or resources when you opt in.',
  'Analyzing usage data to improve site performance, accessibility, and user experience.',
  'Maintaining site security, preventing fraud, and complying with legal or regulatory obligations.',
  'Evaluating aggregate trends to make informed business and product decisions without identifying individuals.',
];

const userRights: string[] = [
  'Access: Request a copy of the personal information we have collected about you.',
  'Correction: Ask us to update or correct inaccurate or incomplete data.',
  'Deletion: Request that we delete your personal data, subject to legal retention requirements.',
  'Opt-Out: Manage cookie preferences or opt out of analytics and advertising cookies via your browser settings.',
  'Objection: Object to specific processing activities, including direct marketing, at any time.',
  'Portability: Request a machine-readable export of the data you have provided to us.',
];

export default function PrivacyPolicyPage(): JSX.Element {
  return (
    <>
      <Section id="privacy-hero" bgColor="bg-neutral-light dark:bg-dark-bg-secondary" padding="py-20 md:py-28">
        <div className="max-w-4xl mx-auto text-center">
          <p className="uppercase tracking-widest text-sm font-semibold text-primary dark:text-dark-primary mb-4">
            Privacy Policy
          </p>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-neutral-darker dark:text-dark-neutral-darker mb-6">
            Your Trust and Data Privacy Matter to MisoTech
          </h1>
          <p className="text-lg md:text-xl text-neutral-dark dark:text-dark-neutral-dark">
            We are committed to explaining, in clear language, what information we collect, how we use it, and what rights you have to stay in control.
          </p>
        </div>
      </Section>

      <Section id="privacy-introduction" padding="py-16 md:py-24">
        <div className="prose prose-lg dark:prose-invert max-w-4xl mx-auto">
          <p>
            This Privacy Policy outlines the practices MisoTech follows when handling personal information across our website,
            newsletters, and any services that link to this page. By using our site, you acknowledge that you have read and agree
            to the terms described here. If you have any questions, you can reach us using the contact details at the end of this page.
          </p>
        </div>
      </Section>

      <Section id="privacy-collection" bgColor="bg-neutral-light dark:bg-dark-bg-secondary">
        <SectionHeading
          title="Information We Collect"
          subtitle="Transparency around the personal and technical data collected through your interactions with MisoTech."
        />
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {informationWeCollect.map((category) => (
            <div key={category.title} className="bg-white dark:bg-dark-bg-primary border border-neutral-light/60 dark:border-dark-neutral-muted/40 rounded-2xl p-6 shadow-sm dark:shadow-neutral-black/10">
              <h3 className="text-xl font-semibold text-neutral-darker dark:text-dark-neutral-darker mb-3">
                {category.title}
              </h3>
              <p className="text-neutral-dark dark:text-dark-neutral-dark mb-4">
                {category.description}
              </p>
              <ul className="space-y-3 list-disc list-inside text-neutral-dark dark:text-dark-neutral-dark">
                {category.bulletPoints.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section id="privacy-usage">
        <SectionHeading
          title="How We Use Your Information"
          subtitle="We only process personal data for legitimate purposes that support your experience and our services."
        />
        <div className="max-w-4xl mx-auto bg-white dark:bg-dark-bg-secondary border border-neutral-light/60 dark:border-dark-neutral-muted/40 rounded-2xl p-8 shadow-sm dark:shadow-neutral-black/10">
          <ul className="space-y-4 list-disc pl-5 text-neutral-dark dark:text-dark-neutral-dark text-base md:text-lg">
            {waysWeUseInformation.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </Section>

      <Section id="privacy-cookies" bgColor="bg-neutral-light dark:bg-dark-bg-secondary">
        <SectionHeading
          title="Third-Party Advertising & Cookies"
          subtitle="Understanding the tools we and our partners use to deliver analytics insights and relevant advertising."
        />
        <div className="max-w-4xl mx-auto space-y-6 text-neutral-dark dark:text-dark-neutral-dark text-base md:text-lg">
          <p>
            We partner with Google AdSense and similar advertising networks to display contextual ads. These partners may place cookies
            or use tracking pixels to measure ad performance and prevent repetitive impressions. The data gathered is pseudonymous and
            does not reveal your identity to us.
          </p>
          <p>
            You can manage or disable cookies at any time through your browser settings. Opting out may affect certain personalized
            experiences, but core site functionality will remain available. To learn more about advertising cookies or to opt out of
            interest-based ads, visit the <a href="https://policies.google.com/technologies/ads" className="text-primary dark:text-dark-primary underline">Google Ads Policy Center</a>.
          </p>
          <p>
            We also use analytics cookies from Google Analytics and Vercel Analytics. These cookies help us understand traffic patterns
            and improve site performance. Analytics data is aggregated and does not identify individual visitors.
          </p>
        </div>
      </Section>

      <Section id="privacy-rights">
        <SectionHeading
          title="Your Rights & Choices"
          subtitle="You are in control of your personal information, and we respect every request to exercise these rights."
        />
        <div className="max-w-4xl mx-auto bg-white dark:bg-dark-bg-secondary border border-neutral-light/60 dark:border-dark-neutral-muted/40 rounded-2xl p-8 shadow-sm dark:shadow-neutral-black/10">
          <ul className="space-y-4 list-disc pl-5 text-neutral-dark dark:text-dark-neutral-dark text-base md:text-lg">
            {userRights.map((right) => (
              <li key={right}>{right}</li>
            ))}
          </ul>
          <p className="mt-6 text-neutral-dark dark:text-dark-neutral-dark">
            To exercise your rights, contact us via email at
            <a href="mailto:1479333689@qq.com" className="text-primary dark:text-dark-primary font-medium ml-2">1479333689@qq.com</a>.
            Please include sufficient details so that we can verify your identity and process your request promptly.
          </p>
        </div>
      </Section>

      <Section id="privacy-security" bgColor="bg-neutral-light dark:bg-dark-bg-secondary">
        <SectionHeading
          title="Data Security & Retention"
          subtitle="Safeguards that protect your information and the duration for which we keep it."
        />
        <div className="max-w-4xl mx-auto space-y-6 text-neutral-dark dark:text-dark-neutral-dark text-base md:text-lg">
          <p>
            We implement industry-standard technical and organizational measures to protect your data against unauthorized access,
            alteration, disclosure, or destruction. These measures include secure hosting, encryption in transit, access controls,
            and routine monitoring for suspicious activity.
          </p>
          <p>
            We retain personal information only for as long as is necessary to fulfill the purposes outlined in this policy, comply with
            legal obligations, resolve disputes, and enforce agreements. When data is no longer required, it is securely deleted or anonymized.
          </p>
        </div>
      </Section>

      <Section id="privacy-contact">
        <SectionHeading
          title="Contact & Policy Updates"
          subtitle="Reach out for privacy questions and stay informed about future changes."
        />
        <div className="max-w-4xl mx-auto text-neutral-dark dark:text-dark-neutral-dark text-base md:text-lg space-y-6">
          <p>
            If you have any questions about this Privacy Policy or wish to exercise your rights, please email
            <a href="mailto:1479333689@qq.com" className="text-primary dark:text-dark-primary font-medium ml-2">1479333689@qq.com</a>
            or use our <Link href="/contact" className="text-primary dark:text-dark-primary underline">contact page</Link>.
          </p>
          <p>
            We may update this Privacy Policy to reflect new features, legal requirements, or industry best practices. When we make
            material changes, we will update the “Last updated” date below and, where appropriate, notify you through the site or email.
          </p>
          <p className="text-sm text-neutral-medium dark:text-dark-neutral-medium uppercase tracking-wide">
            Last updated: {new Date().toISOString().split('T')[0]}
          </p>
        </div>
      </Section>
    </>
  );
}
