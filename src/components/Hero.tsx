"use client";

import React from 'react';
import Button from './Button';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { transitions, easing } from '@/styles/animations';

interface HeroProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  imageSrc: string;
  imageAlt: string;
  useGradientTitle?: boolean;
}

const Hero: React.FC<HeroProps> = ({
  title,
  subtitle,
  ctaText,
  ctaLink,
  secondaryCtaText,
  secondaryCtaLink,
  imageSrc,
  imageAlt,
  useGradientTitle = true,
}) => {
  // Split title for gradient effect
  const titleParts = title.split('|').map(part => part.trim());

  return (
    <div className="relative overflow-hidden bg-deep-charcoal bg-noise-overlay">
      {/* Industrial tech background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-tech-grid bg-tech-grid"></div>

        {/* Animated scan line */}
        <motion.div
          className="absolute inset-0 opacity-10"
          animate={{
            y: ['-100%', '100%'],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <div className="h-2 w-full bg-gradient-to-r from-transparent via-neon-orange to-transparent"></div>
        </motion.div>

        {/* Floating industrial elements */}
        <motion.div
          className="absolute top-20 right-20 w-64 h-64 border border-neon-orange/10 rounded-full"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-48 h-48 border border-electric-blue/10"
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, -60, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Neon gradient accents */}
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-neon-orange/5 to-transparent rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-electric-blue/5 to-transparent rounded-full blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 md:py-32 lg:py-40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text content */}
          <motion.div
            className="order-2 lg:order-1 text-center lg:text-left"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: transitions.smooth.duration / 1000,
              ease: easing.easeOut,
            }}
          >
            {/* Tech badge */}
            <motion.div
              className="inline-block mb-4 px-4 py-1.5 border border-neon-orange/30 rounded-full bg-neon-orange/5 backdrop-blur-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <span className="text-xs font-mono text-neon-orange tracking-widest uppercase">
                // System Online
              </span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold font-heading leading-tight tracking-tight">
              {useGradientTitle && titleParts.length > 1 ? (
                <>
                  <span className="gradient-text">{titleParts[0]}</span>
                  {titleParts.slice(1).map((part, i) => (
                    <React.Fragment key={i}>
                      <br />
                      <span className="gradient-text">{part}</span>
                    </React.Fragment>
                  ))}
                </>
              ) : (
                <span className="text-white">{title}</span>
              )}
            </h1>

            <motion.p
              className="mt-6 sm:mt-8 text-lg sm:text-xl md:text-2xl text-metallic leading-relaxed max-w-2xl mx-auto lg:mx-0 font-light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: transitions.smooth.duration / 1000,
                ease: easing.easeOut,
                delay: 0.3,
              }}
            >
              {subtitle}
            </motion.p>

            <motion.div
              className="mt-8 sm:mt-10 md:mt-12 flex flex-wrap gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: transitions.smooth.duration / 1000,
                ease: easing.easeOut,
                delay: 0.4,
              }}
            >
              <Button
                href={ctaLink}
                size="lg"
                className="electric-border bg-neon-orange/10 hover:bg-neon-orange/20 text-neon-orange border-neon-orange/30 hover:border-neon-orange transition-all duration-300"
              >
                {ctaText}
              </Button>
              {secondaryCtaText && secondaryCtaLink && (
                <Button
                  href={secondaryCtaLink}
                  variant="outline"
                  size="lg"
                  className="border-electric-blue/30 hover:border-electric-blue text-electric-blue hover:bg-electric-blue/10 transition-all duration-300"
                >
                  {secondaryCtaText}
                </Button>
              )}
            </motion.div>

            {/* Tech stats */}
            <motion.div
              className="mt-12 grid grid-cols-3 gap-6 border-t border-metallic/10 pt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <div className="text-center lg:text-left">
                <div className="text-2xl sm:text-3xl font-bold font-heading text-neon-orange">50+</div>
                <div className="text-xs font-mono text-metallic mt-1">PROJECTS</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl sm:text-3xl font-bold font-heading text-electric-blue">100%</div>
                <div className="text-xs font-mono text-metallic mt-1">QUALITY</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl sm:text-3xl font-bold font-heading text-acid-green">24/7</div>
                <div className="text-xs font-mono text-metallic mt-1">SUPPORT</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Image with industrial styling */}
          <motion.div
            className="order-1 lg:order-2 relative h-64 sm:h-80 md:h-96 lg:h-[28rem] tech-card mb-8 lg:mb-0 group"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: transitions.smooth.duration / 1000,
              ease: easing.easeOut,
            }}
            whileHover={{
              y: -12,
              transition: {
                duration: transitions.fast.duration / 1000,
              },
            }}
          >
            {/* Industrial corner accents */}
            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-neon-orange/50"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-electric-blue/50"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-electric-blue/50"></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-neon-orange/50"></div>

            {/* Tech overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-neon-orange/0 via-transparent to-electric-blue/0 group-hover:from-neon-orange/10 group-hover:to-electric-blue/10 transition-all duration-500 z-10"></div>

            {imageSrc && (
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority={true}
                quality={90}
                onError={() => {
                  console.error('Hero image failed to load:', imageSrc);
                }}
              />
            )}

            {/* Floating label */}
            <motion.div
              className="absolute bottom-4 left-4 z-20 px-3 py-1.5 bg-deep-charcoal/80 backdrop-blur-sm border border-metallic/20 rounded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.4 }}
            >
              <span className="text-xs font-mono text-metallic">
                <span className="text-neon-orange">●</span> LIVE
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-deep-charcoal to-transparent"></div>
    </div>
  );
};

export default Hero; 