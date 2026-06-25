"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Section from '@/components/Section';
import Button from '@/components/Button';
import ServiceCard from '@/components/ServiceCard';
import ProjectInquiryForm from '@/components/ProjectInquiryForm';
import { SERVICES } from '@/data/services';

interface ServicesPageContentProps {
  locale: 'en' | 'zh';
}

const ServicesPageContent: React.FC<ServicesPageContentProps> = ({ locale }) => {
  const t = SERVICES[locale];

  return (
    <>
      {/* ════════ 1. HERO ════════ */}
      <section className="relative overflow-hidden bg-white dark:bg-deep-charcoal pt-24 sm:pt-28 md:pt-32 pb-16 md:pb-20">
        {/* Tech background grid */}
        <div className="absolute inset-0 bg-tech-grid bg-tech-grid opacity-50 pointer-events-none" />

        {/* Animated scan line */}
        <motion.div
          className="absolute inset-0 opacity-10 pointer-events-none"
          animate={{ y: ['-100%', '100%'] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        >
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-neon-orange to-transparent" />
        </motion.div>

        {/* Gradient accents */}
        <motion.div
          className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-neon-orange/10 to-transparent rounded-full blur-3xl pointer-events-none"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-electric-blue/10 to-transparent rounded-full blur-3xl pointer-events-none"
          animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-block mb-6 px-4 py-1.5 border border-neon-orange/30 rounded-full bg-neon-orange/5 backdrop-blur-sm"
          >
            <span className="text-xs font-mono text-neon-orange tracking-widest uppercase">
              {t.hero.badge}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold font-heading leading-tight tracking-tight text-neutral-darker dark:text-white"
          >
            <span className="gradient-text">{t.hero.titleLine1}</span>
            <br />
            <span className="text-neutral-darker dark:text-white">{t.hero.titleLine2}</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 sm:mt-8 text-base sm:text-lg md:text-xl text-neutral-dark dark:text-metallic leading-relaxed max-w-3xl mx-auto font-light"
          >
            {t.hero.subtitle}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 sm:mt-10 flex flex-wrap gap-4 justify-center"
          >
            <Button
              href="#inquiry"
              size="lg"
              className="electric-border bg-neon-orange/10 hover:bg-neon-orange/20 text-neon-orange border-neon-orange/30 hover:border-neon-orange transition-all duration-300"
            >
              {t.hero.ctaPrimary}
            </Button>
            <Button
              href={t.hero.secondaryHref}
              variant="outline"
              size="lg"
              className="border-electric-blue/30 hover:border-electric-blue text-electric-blue hover:bg-electric-blue/10 transition-all duration-300"
            >
              {t.hero.ctaSecondary}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ════════ 2. WHAT I BUILD ════════ */}
      <Section id="tiers" bgColor="bg-surface-light dark:bg-industrial-gray/40">
        <div className="text-center mb-12 md:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-neutral-darker dark:text-white mb-4"
          >
            {t.tiersHeading.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-neutral-dark dark:text-metallic max-w-2xl mx-auto"
          >
            {t.tiersHeading.subtitle}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {t.tiers.map((tier, i) => (
            <ServiceCard
              key={tier.number}
              number={tier.number}
              title={tier.title}
              subtitle={tier.subtitle}
              description={tier.description}
              features={tier.features}
              timeline={tier.timeline}
              accent={tier.accent}
              ctaText={t.hero.ctaPrimary}
              ctaHref="#inquiry"
              index={i}
            />
          ))}
        </div>

        {/* ── Advisory card ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 lg:mt-10 relative rounded-2xl bg-white dark:bg-deep-charcoal/60 backdrop-blur-sm border border-metallic/20 hover:border-metallic/40 transition-colors duration-500 overflow-hidden group"
        >
          <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-metallic/40 pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-metallic/40 pointer-events-none" />

          <div className="relative p-7 sm:p-10 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 items-start">
            <div className="md:col-span-2">
              <span className="text-xs font-mono text-metallic tracking-widest uppercase">
                {t.advisory.label}
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold font-heading text-neutral-darker dark:text-white mt-2 mb-1">
                {t.advisory.title}
              </h3>
              <span className="text-sm font-mono text-metallic">{t.advisory.subtitle}</span>
              <p className="mt-4 text-base text-neutral-dark dark:text-metallic leading-relaxed">
                {t.advisory.description}
              </p>
            </div>
            <div className="md:col-span-1">
              <ul className="space-y-2.5 mb-6">
                {t.advisory.features.map((feat, i) => (
                  <li key={i} className="flex items-start text-sm text-neutral-dark dark:text-metallic">
                    <span className="flex-shrink-0 text-metallic mr-2.5 mt-0.5 font-mono">›</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <Button
                href="#inquiry"
                size="md"
                variant="outline"
                className="border-metallic/40 hover:border-metallic text-neutral-darker dark:text-white hover:bg-metallic/10"
              >
                {t.advisory.cta}
              </Button>
            </div>
          </div>
        </motion.div>
      </Section>

      {/* ════════ 3. WHY WORK WITH ME ════════ */}
      <Section id="why" bgColor="bg-white dark:bg-deep-charcoal">
        <div className="text-center mb-12 md:mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-neutral-darker dark:text-white mb-4"
          >
            {t.whyHeading.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-neutral-dark dark:text-metallic max-w-2xl mx-auto"
          >
            {t.whyHeading.subtitle}
          </motion.p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {t.why.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="relative p-6 rounded-xl border border-neutral-200 dark:border-metallic/20 hover:border-neon-orange/40 bg-surface-light/50 dark:bg-industrial-gray/30 transition-all duration-300 group"
            >
              <div className="text-3xl sm:text-4xl font-bold font-heading text-neon-orange mb-2 group-hover:scale-105 transition-transform origin-left">
                {item.stat}
              </div>
              <div className="text-xs font-mono text-neutral-medium dark:text-metallic tracking-widest mb-3">
                {item.label}
              </div>
              <p className="text-sm text-neutral-dark dark:text-metallic leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ════════ 4. PROCESS ════════ */}
      <Section id="process" bgColor="bg-surface-light dark:bg-industrial-gray/40">
        <div className="text-center mb-12 md:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-neutral-darker dark:text-white mb-4"
          >
            {t.processHeading.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-neutral-dark dark:text-metallic max-w-2xl mx-auto"
          >
            {t.processHeading.subtitle}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {t.process.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative p-6 rounded-xl border border-electric-blue/20 hover:border-electric-blue/50 bg-white dark:bg-deep-charcoal/60 transition-all duration-300 group"
            >
              <div className="absolute top-3 left-3 w-5 h-5 border-l-2 border-t-2 border-electric-blue/40 pointer-events-none" />
              <div className="relative">
                <div className="text-2xl sm:text-3xl font-mono font-bold text-electric-blue mb-3">
                  {step.number}
                </div>
                <h3 className="text-lg font-bold font-heading text-neutral-darker dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-neutral-dark dark:text-metallic leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ════════ 5. INQUIRY FORM ════════ */}
      <Section id="inquiry" bgColor="bg-white dark:bg-deep-charcoal">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 md:mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-neutral-darker dark:text-white mb-4"
            >
              <span className="gradient-text">{t.inquiry.heading}</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-base sm:text-lg text-neutral-dark dark:text-metallic max-w-2xl mx-auto"
            >
              {t.inquiry.subheading}
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="relative rounded-2xl border border-neutral-200 dark:border-metallic/20 bg-surface-light/40 dark:bg-industrial-gray/30 p-6 sm:p-8 md:p-10"
          >
            {/* Industrial corner accents */}
            <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-neon-orange/40 pointer-events-none" />
            <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-electric-blue/40 pointer-events-none" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-electric-blue/40 pointer-events-none" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-neon-orange/40 pointer-events-none" />

            <ProjectInquiryForm locale={locale} />
          </motion.div>
        </div>
      </Section>

      {/* ════════ 6. FAQ ════════ */}
      <Section id="faq" bgColor="bg-surface-light dark:bg-industrial-gray/40">
        <div className="text-center mb-10 md:mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-neutral-darker dark:text-white"
          >
            {t.faqHeading.title}
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 max-w-5xl mx-auto">
          {t.faq.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="p-6 rounded-xl border border-neutral-200 dark:border-metallic/20 bg-white dark:bg-deep-charcoal/60 hover:border-neon-orange/40 transition-colors duration-300"
            >
              <h3 className="text-lg font-bold font-heading text-neutral-darker dark:text-white mb-3 flex items-start">
                <span className="text-neon-orange font-mono mr-2 flex-shrink-0">Q.</span>
                <span>{item.question}</span>
              </h3>
              <p className="text-sm sm:text-base text-neutral-dark dark:text-metallic leading-relaxed pl-7">
                {item.answer}
              </p>
            </motion.div>
          ))}
        </div>
      </Section>
    </>
  );
};

export default ServicesPageContent;
