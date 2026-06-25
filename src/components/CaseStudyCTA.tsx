"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface CaseStudyCTAProps {
  locale?: 'en' | 'zh';
}

const COPY = {
  en: {
    badge: '// INSPIRED BY THIS PROJECT?',
    title: 'Need something similar built?',
    description:
      'I take on a handful of client projects each quarter — AI applications, enterprise systems, and product MVPs. If this case study lines up with what you need, let&apos;s talk.',
    primaryCta: 'Discuss Your Project →',
    secondaryCta: 'See Service Tiers',
    href: '/services#inquiry',
    secondaryHref: '/services',
  },
  zh: {
    badge: '// 喜欢这个项目？',
    title: '想做类似的项目？',
    description:
      '每季度只接少量客户项目——AI 应用、企业系统、产品 MVP。如果这个案例和你的需求吻合，欢迎聊聊。',
    primaryCta: '聊聊你的项目 →',
    secondaryCta: '查看服务包',
    href: '/zh/services#inquiry',
    secondaryHref: '/zh/services',
  },
};

const CaseStudyCTA: React.FC<CaseStudyCTAProps> = ({ locale = 'en' }) => {
  const t = COPY[locale];

  return (
    <section className="relative py-16 md:py-20 bg-white dark:bg-deep-charcoal overflow-hidden">
      {/* Background accents */}
      <div className="absolute inset-0 bg-tech-grid bg-tech-grid opacity-30 pointer-events-none" />
      <motion.div
        className="absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-br from-neon-orange/10 to-transparent rounded-full blur-3xl pointer-events-none"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="relative rounded-2xl border border-neon-orange/30 bg-surface-light/40 dark:bg-industrial-gray/40 backdrop-blur-sm p-7 sm:p-10 md:p-12 overflow-hidden group"
        >
          {/* Industrial corner accents */}
          <div className="absolute top-3 left-3 w-7 h-7 border-l-2 border-t-2 border-neon-orange/50 pointer-events-none" />
          <div className="absolute top-3 right-3 w-7 h-7 border-r-2 border-t-2 border-electric-blue/50 pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-7 h-7 border-l-2 border-b-2 border-electric-blue/50 pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-7 h-7 border-r-2 border-b-2 border-neon-orange/50 pointer-events-none" />

          {/* Subtle hover glow */}
          <div className="absolute inset-0 bg-neon-orange/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          <div className="relative z-10 text-center">
            <span className="inline-block mb-4 text-xs font-mono text-neon-orange tracking-widest uppercase">
              {t.badge}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-heading text-neutral-darker dark:text-white mb-4">
              <span className="gradient-text">{t.title}</span>
            </h2>
            <p
              className="text-base sm:text-lg text-neutral-dark dark:text-metallic leading-relaxed max-w-2xl mx-auto mb-8"
              dangerouslySetInnerHTML={{ __html: t.description }}
            />

            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href={t.href}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-neon-orange/40 bg-neon-orange/10 hover:bg-neon-orange/20 hover:border-neon-orange text-neon-orange font-medium transition-all duration-300 hover:translate-x-0.5"
              >
                <span>{t.primaryCta}</span>
              </Link>
              <Link
                href={t.secondaryHref}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-electric-blue/30 hover:border-electric-blue hover:bg-electric-blue/10 text-electric-blue font-medium transition-all duration-300"
              >
                <span>{t.secondaryCta}</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CaseStudyCTA;
