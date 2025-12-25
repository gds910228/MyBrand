'use client';

import Link from 'next/link';
import Section from '@/components/Section';
import SectionHeading from '@/components/SectionHeading';
import { motion } from 'framer-motion';

const informationWeCollect = [
  {
    icon: '📝',
    title: '您主动提供的信息',
    description: '当您与我们互动或直接联系时，您自愿提交的详细信息。',
    bulletPoints: [
      '当您提交表单或发送邮件时提供的姓名、邮箱、公司与角色等联系方式。',
      '在联系或合作需求中填写的项目要求、反馈内容以及您想传达的其它信息。',
      '订阅邮件或下载资料时自愿提供的其他个人资料（若您选择填写）。',
    ],
  },
  {
    icon: '📊',
    title: '自动收集的信息',
    description: '借助分析工具自动收集的技术数据，帮助我们了解用户如何使用本站。',
    bulletPoints: [
      'IP 地址、近似地理位置、浏览器类型、操作系统及设备信息。',
      '访问的页面、停留时长、来源链接、滚动深度等站点交互指标。',
      '页面加载性能与错误报告等聚合指标，用于提升站点稳定性。',
    ],
  },
  {
    icon: '🍪',
    title: 'Cookies 及类似技术',
    description: '存储于您设备中的小型数据文件，用于支持核心功能与个性化体验。',
    bulletPoints: [
      '维持会话状态、安全性与语言偏好的必要 Cookies。',
      '来自 Google Analytics 与 Vercel Analytics 的分析 Cookies，用于统计访问趋势。',
      '由 Google AdSense 设置的广告 Cookies，用于提供相关广告并减少重复展示。',
    ],
  },
];

const waysWeUseInformation = [
  '回复您发起的咨询、项目合作与沟通请求。',
  '在您同意的前提下，为您提供定制化内容、资讯邮件或资源下载。',
  '分析站点使用数据，以优化性能、可访问性与整体体验。',
  '维护站点安全、防范欺诈行为，并遵守法律或监管要求。',
  '基于汇总数据洞察行业趋势，辅助产品与业务决策，而不会识别个体身份。',
];

const userRights = [
  '访问权：请求获取我们所保存的您的个人信息副本。',
  '更正权：要求我们更新或修正不准确、不完整的数据。',
  '删除权：在符合法律保留义务的情况下，要求删除您的个人数据。',
  '选择权：通过浏览器设置管理或拒绝分析、广告 Cookies。',
  '反对权：随时反对特定处理活动，包括直接营销。',
  '携带权：请求导出您提供给我们的数据，并以机器可读格式提供。',
];

export default function PrivacyPolicyZhContent(): JSX.Element {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <Section id="privacy-hero" bgColor="bg-neutral-light dark:bg-dark-bg-secondary" padding="py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-neutral-darker dark:text-dark-neutral-darker mb-6 leading-tight">
            您的信任与数据隐私对 MisoTech 很重要
          </h1>
          <p className="text-lg md:text-xl text-neutral-dark dark:text-dark-neutral-dark">
            我们承诺以清晰易懂的语言说明收集哪些信息、如何使用，并帮助您掌控个人数据。
          </p>
        </motion.div>
      </Section>

      <Section id="privacy-introduction" padding="py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p>
              本隐私政策适用于 MisoTech 网站、资讯邮件及任何指向本页面的服务。访问或使用本站即表示您已阅读并同意文中所述实践。如有疑问，欢迎通过本页底部提供的联系方式与我们取得联系。
            </p>
          </div>
        </motion.div>
      </Section>

      <Section id="privacy-collection" bgColor="bg-neutral-light dark:bg-dark-bg-secondary">
        <SectionHeading
          title="📊 我们收集的信息"
          subtitle="透明列举您与 MisoTech 互动过程中可能产生的个人与技术数据。"
        />
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {informationWeCollect.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white dark:bg-dark-bg-primary border border-neutral-light/60 dark:border-dark-neutral-muted/40 rounded-2xl p-6 shadow-sm dark:shadow-neutral-black/10 hover:shadow-md dark:hover:shadow-neutral-black/20 transition-shadow"
            >
              <div className="text-4xl mb-4">{category.icon}</div>
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
            </motion.div>
          ))}
        </div>
      </Section>

      <Section id="privacy-usage">
        <SectionHeading
          title="🎯 我们如何使用这些信息"
          subtitle="仅在合法、必要的场景下处理个人数据，以提升体验并保障服务。"
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto bg-white dark:bg-dark-bg-secondary border border-neutral-light/60 dark:border-dark-neutral-muted/40 rounded-2xl p-8 shadow-sm dark:shadow-neutral-black/10"
        >
          <ul className="space-y-4 list-disc pl-5 text-neutral-dark dark:text-dark-neutral-dark text-base md:text-lg">
            {waysWeUseInformation.map((item, index) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                {item}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </Section>

      <Section id="privacy-cookies" bgColor="bg-neutral-light dark:bg-dark-bg-secondary">
        <SectionHeading
          title="🍪 第三方广告与 Cookies"
          subtitle="了解我们与合作伙伴如何利用 Cookies 提供分析洞察和相关广告。"
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto space-y-6 text-neutral-dark dark:text-dark-neutral-dark text-base md:text-lg"
        >
          <p>
            我们与 Google AdSense 等广告网络合作，以展示具有关联性的广告。这些合作伙伴可能设置 Cookies 或跟踪像素，用于衡量广告效果并避免重复展示。所收集的数据为化名化信息，不会向我们透露您的真实身份。
          </p>
          <p>
            您可以随时通过浏览器设置管理或禁用 Cookies。拒绝 Cookies 可能影响部分个性化体验，但不影响核心功能。有关广告 Cookies 的更多信息或选择退出基于兴趣的广告，请访问
            <a href="https://policies.google.com/technologies/ads" className="text-primary dark:text-dark-primary underline hover:opacity-80 transition-opacity">Google 广告政策中心</a>。
          </p>
          <p>
            此外，我们使用 Google Analytics 与 Vercel Analytics 提供的分析 Cookies，用于了解整体流量趋势并优化性能。分析数据以汇总形式呈现，不会识别单个访问者。
          </p>
        </motion.div>
      </Section>

      <Section id="privacy-rights">
        <SectionHeading
          title="⚖️ 您的权利与选择"
          subtitle="您拥有充分的信息掌控权，我们将积极响应每一次请求。"
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto bg-white dark:bg-dark-bg-secondary border border-neutral-light/60 dark:border-dark-neutral-muted/40 rounded-2xl p-8 shadow-sm dark:shadow-neutral-black/10"
        >
          <ul className="space-y-4 list-disc pl-5 text-neutral-dark dark:text-dark-neutral-dark text-base md:text-lg">
            {userRights.map((right, index) => (
              <motion.li
                key={right}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                {right}
              </motion.li>
            ))}
          </ul>
          <p className="mt-6 text-neutral-dark dark:text-dark-neutral-dark">
            若需行使上述权利，请发送邮件至
            <a href="mailto:1479333689@qq.com" className="text-primary dark:text-dark-primary font-medium ml-2 hover:opacity-80 transition-opacity">1479333689@qq.com</a>。
            请在邮件中提供足够的信息，以便我们验证身份并及时处理您的申请。
          </p>
        </motion.div>
      </Section>

      <Section id="privacy-security" bgColor="bg-neutral-light dark:bg-dark-bg-secondary">
        <SectionHeading
          title="🛡️ 数据安全与保留"
          subtitle="我们采取的安全措施以及个人数据的保留周期。"
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto space-y-6 text-neutral-dark dark:text-dark-neutral-dark text-base md:text-lg"
        >
          <p>
            我们实施行业标准的技术与组织措施，防止您的数据被未授权访问、篡改、披露或销毁。这些措施包括安全托管、传输加密、访问控制与异常监测等。
          </p>
          <p>
            我们仅在实现政策目的、履行法律义务、解决争议或执行协议所需的期限内保留个人信息。待数据失去使用必要时，将被安全删除或匿名化处理。
          </p>
        </motion.div>
      </Section>

      <Section id="privacy-contact">
        <SectionHeading
          title="📞 联系方式与政策更新"
          subtitle="如有隐私问题，欢迎随时与我们沟通，并及时了解后续更新。"
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto text-neutral-dark dark:text-dark-neutral-dark text-base md:text-lg space-y-6"
        >
          <p>
            若对本隐私政策有任何疑问，或希望行使您的权利，请发送邮件至
            <a href="mailto:1479333689@qq.com" className="text-primary dark:text-dark-primary font-medium ml-2 hover:opacity-80 transition-opacity">1479333689@qq.com</a>
            ，或访问我们的<Link href="/zh/contact" className="text-primary dark:text-dark-primary underline hover:opacity-80 transition-opacity">联系页面</Link>。
          </p>
          <p>
            当我们推出新功能、适配法律要求或采纳行业最佳实践时，可能会更新本政策。若有重大变更，我们将更新下方"最后更新"日期，并在站内或邮件中提供额外通知（如适用）。
          </p>
          <div className="bg-neutral-light/50 dark:bg-dark-bg-secondary/50 border border-neutral-muted/30 dark:border-dark-neutral-muted/30 rounded-lg p-4 text-center">
            <p className="text-sm font-semibold text-primary dark:text-dark-primary uppercase tracking-wide">
              📅 最后更新：{formatDate(new Date())}
            </p>
          </div>
        </motion.div>
      </Section>
    </>
  );
}
