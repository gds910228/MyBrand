"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { ServiceAccent } from '@/data/services';

interface ServiceCardProps {
  number: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  timeline: string;
  accent: ServiceAccent;
  ctaText: string;
  ctaHref: string;
  index?: number;
}

// Accent classname maps — Tailwind cannot tree-shake dynamic class names,
// so the full strings live here statically.
const accentMap: Record<ServiceAccent, {
  text: string;
  border: string;
  borderHover: string;
  bgSoft: string;
  cornerTop: string;
  cornerBottom: string;
  glow: string;
}> = {
  orange: {
    text: 'text-neon-orange',
    border: 'border-neon-orange/20',
    borderHover: 'group-hover:border-neon-orange/60',
    bgSoft: 'bg-neon-orange/5',
    cornerTop: 'border-l-2 border-t-2 border-neon-orange/40',
    cornerBottom: 'border-r-2 border-b-2 border-neon-orange/40',
    glow: 'group-hover:shadow-[0_0_30px_rgba(255,107,53,0.15)]',
  },
  blue: {
    text: 'text-electric-blue',
    border: 'border-electric-blue/20',
    borderHover: 'group-hover:border-electric-blue/60',
    bgSoft: 'bg-electric-blue/5',
    cornerTop: 'border-l-2 border-t-2 border-electric-blue/40',
    cornerBottom: 'border-r-2 border-b-2 border-electric-blue/40',
    glow: 'group-hover:shadow-[0_0_30px_rgba(0,217,255,0.15)]',
  },
  green: {
    text: 'text-acid-green',
    border: 'border-acid-green/20',
    borderHover: 'group-hover:border-acid-green/60',
    bgSoft: 'bg-acid-green/5',
    cornerTop: 'border-l-2 border-t-2 border-acid-green/40',
    cornerBottom: 'border-r-2 border-b-2 border-acid-green/40',
    glow: 'group-hover:shadow-[0_0_30px_rgba(57,255,20,0.15)]',
  },
};

const ServiceCard: React.FC<ServiceCardProps> = ({
  number,
  title,
  subtitle,
  description,
  features,
  timeline,
  accent,
  ctaText,
  ctaHref,
  index = 0,
}) => {
  const a = accentMap[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -8 }}
      className={`group relative h-full flex flex-col rounded-2xl bg-white dark:bg-deep-charcoal/60 backdrop-blur-sm border ${a.border} ${a.borderHover} ${a.glow} transition-all duration-500 overflow-hidden`}
    >
      {/* Industrial corner accents */}
      <div className={`absolute top-3 left-3 w-6 h-6 ${a.cornerTop} pointer-events-none`} />
      <div className={`absolute bottom-3 right-3 w-6 h-6 ${a.cornerBottom} pointer-events-none`} />

      {/* Subtle accent gradient on hover */}
      <div
        className={`absolute inset-0 ${a.bgSoft} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
      />

      <div className="relative z-10 flex flex-col h-full p-7 sm:p-8">
        {/* Number + Subtitle row */}
        <div className="flex items-start justify-between mb-5">
          <span className={`text-4xl sm:text-5xl font-mono font-bold ${a.text} leading-none`}>
            {number}
          </span>
          <span className="text-xs font-mono text-neutral-medium dark:text-metallic tracking-widest uppercase mt-2">
            {subtitle}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-bold font-heading text-neutral-darker dark:text-white mb-3 leading-tight">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm sm:text-base text-neutral-dark dark:text-metallic leading-relaxed mb-6">
          {description}
        </p>

        {/* Features list */}
        <ul className="space-y-2.5 mb-6 flex-grow">
          {features.map((feature, i) => (
            <li
              key={i}
              className="flex items-start text-sm text-neutral-dark dark:text-metallic"
            >
              <span className={`flex-shrink-0 ${a.text} mr-2.5 mt-0.5 font-mono`}>›</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Timeline badge */}
        <div
          className={`inline-flex items-center px-3 py-1.5 mb-5 rounded-md ${a.bgSoft} border ${a.border} self-start`}
        >
          <span className={`text-xs font-mono ${a.text} tracking-wide`}>
            ⏱ {timeline}
          </span>
        </div>

        {/* CTA */}
        <Link
          href={ctaHref}
          className={`inline-flex items-center justify-between px-4 py-3 rounded-lg border ${a.border} ${a.borderHover} ${a.bgSoft} ${a.text} font-medium text-sm transition-all duration-300 hover:translate-x-1`}
        >
          <span>{ctaText}</span>
          <span className="font-mono">→</span>
        </Link>
      </div>
    </motion.div>
  );
};

export default ServiceCard;
