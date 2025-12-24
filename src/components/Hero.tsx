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
  useGradientTitle = false,
}) => {
  // Split title for gradient effect
  const titleParts = title.split('|').map(part => part.trim());

  return (
    <div className="relative overflow-hidden bg-neutral-light dark:bg-dark-bg-primary">
      {/* Animated background patterns */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-tech-grid opacity-30"></div>

        {/* Floating gradient orbs */}
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-fuchsia-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-28 lg:py-36">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Text content */}
          <motion.div
            className="order-2 lg:order-1 text-center lg:text-left"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: transitions.smooth.duration / 1000,
              ease: easing.easeOut,
            }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-heading text-neutral-darker dark:text-dark-neutral-darker leading-tight">
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
                title
              )}
            </h1>
            <motion.p
              className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-neutral-dark dark:text-dark-neutral-dark max-w-2xl mx-auto lg:mx-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: transitions.smooth.duration / 1000,
                ease: easing.easeOut,
                delay: 0.1,
              }}
            >
              {subtitle}
            </motion.p>
            <motion.div
              className="mt-6 sm:mt-8 md:mt-10 flex flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: transitions.smooth.duration / 1000,
                ease: easing.easeOut,
                delay: 0.2,
              }}
            >
              <Button href={ctaLink} size="lg">
                {ctaText}
              </Button>
              {secondaryCtaText && secondaryCtaLink && (
                <Button href={secondaryCtaLink} variant="outline" size="lg">
                  {secondaryCtaText}
                </Button>
              )}
            </motion.div>
          </motion.div>

          {/* Image with enhanced styling */}
          <motion.div
            className="order-1 lg:order-2 relative h-56 sm:h-64 md:h-80 lg:h-96 shadow-2xl rounded-2xl overflow-hidden mb-8 lg:mb-0 group"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: transitions.smooth.duration / 1000,
              ease: easing.easeOut,
            }}
            whileHover={{
              y: -8,
              transition: {
                duration: transitions.fast.duration / 1000,
              },
            }}
          >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/0 via-transparent to-purple-500/0 group-hover:from-cyan-400/10 group-hover:to-purple-500/10 transition-all duration-500 z-10"></div>

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
          </motion.div>
        </div>
      </div>

      {/* Bottom fade gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-neutral-light dark:from-dark-bg-primary to-transparent"></div>
    </div>
  );
};

export default Hero; 