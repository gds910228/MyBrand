"use client";

import React from 'react';
import Button from './Button';
import Image from 'next/image';

interface HeroProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  imageSrc: string;
  imageAlt: string;
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
}) => {
  return (
    <div className="relative overflow-hidden bg-neutral-light">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-primary" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-secondary" />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-28 lg:py-36">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Text content */}
          <div className="order-2 lg:order-1 text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-heading text-neutral-darker leading-tight">
              {title}
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-neutral-dark max-w-2xl mx-auto lg:mx-0">
              {subtitle}
            </p>
            <div className="mt-6 sm:mt-8 md:mt-10 flex flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start">
              <Button href={ctaLink} size="lg">
                {ctaText}
              </Button>
              {secondaryCtaText && secondaryCtaLink && (
                <Button href={secondaryCtaLink} variant="outline" size="lg">
                  {secondaryCtaText}
                </Button>
              )}
            </div>
          </div>
          
          {/* Image */}
          <div className="order-1 lg:order-2 relative h-56 sm:h-64 md:h-80 lg:h-96 shadow-xl rounded-lg overflow-hidden mb-8 lg:mb-0">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority={true}
              quality={85}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero; 