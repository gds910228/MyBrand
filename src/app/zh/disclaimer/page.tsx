import type { Metadata } from 'next';
import Link from 'next/link';
import Section from '@/components/Section';
import SectionHeading from '@/components/SectionHeading';

export const metadata: Metadata = {
  title: '免责声明 | MisoTech',
  description:
    '了解 MisoTech 内容的责任范围、外部链接与广告合作声明，帮助您做出明智判断。',
};

const informationalUsePoints = [
  'MisoTech 上的文章、教程和资料仅供一般信息参考之用。',
  '我们努力保持内容准确、及时，但不对其完整性、正确性或时效性做任何保证。',
  '您根据本站信息做出的技术决策、投资或实施行为需自行承担风险。',
  '在采纳本站见解前，请结合自身情况并考虑咨询具备资质的专业人士。',
];

const externalLinkPoints = [
  '文章可能引用第三方网站、工具或资源，以扩展阅读体验。',
  '我们不对外部链接所指向内容的可靠性、安全性或合法性承担责任，也不构成对其的认可。',
  '访问外部链接需自行判断风险，请在使用前审阅该网站的政策与安全措施。',
  '如发现失效或可能有害的链接，欢迎联系我以便及时核查和更新。',
];

const advertisingPoints = [
  'MisoTech 可能通过 Google AdSense 展示广告，或与品牌合作推出赞助内容。',
  '广告收入有助于支持本站运行，但不会影响我们的编辑立场与观点表达。',
  '如涉及赞助内容，我们会明确标识并保持透明，说明是否存在商业合作。',
  '我们不对广告主的任何承诺、优惠或行为承担责任，请您独立评估其可信度。',
];

export default function DisclaimerZhPage(): JSX.Element {
  return (
    <>
      <Section id="disclaimer-hero" bgColor="bg-neutral-light dark:bg-dark-bg-secondary" padding="py-20 md:py-28">
        <div className="max-w-4xl mx-auto text-center">
          <p className="uppercase tracking-widest text-sm font-semibold text-primary dark:text-dark-primary mb-4">
            免责声明
          </p>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-neutral-darker dark:text-dark-neutral-darker mb-6">
            对本站内容与合作模式的透明说明
          </h1>
          <p className="text-lg md:text-xl text-neutral-dark dark:text-dark-neutral-dark">
            请先阅读本声明，以了解本站内容的使用目的、外部链接的责任范围，以及广告合作的披露方式。
          </p>
        </div>
      </Section>

      <Section id="disclaimer-informational" padding="py-16 md:py-24">
        <SectionHeading
          title="内容仅供参考"
          subtitle="请将本站信息作为参考，并结合自身情况做出判断。"
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
          title="外部链接免责声明"
          subtitle="了解我们在引用第三方资源时的责任界限。"
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
          title="广告与赞助声明"
          subtitle="说明我们如何与合作伙伴协作，并保持编辑独立。"
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
          title="有疑问欢迎联系"
          subtitle="任何反馈都能帮助我们保持声明的准确与透明。"
        />
        <div className="max-w-4xl mx-auto text-neutral-dark dark:text-dark-neutral-dark text-base md:text-lg space-y-6">
          <p>
            如对本免责声明有任何疑问或希望反馈，请发送邮件至
            <a href="mailto:1479333689@qq.com" className="text-primary dark:text-dark-primary font-medium ml-2">1479333689@qq.com</a>
            ，或访问我们的<Link href="/zh/contact" className="text-primary dark:text-dark-primary underline">联系页面</Link>。
          </p>
          <p className="text-sm text-neutral-medium dark:text-dark-neutral-medium uppercase tracking-wide">
            最后更新：{new Date().toISOString().split('T')[0]}
          </p>
        </div>
      </Section>
    </>
  );
}
