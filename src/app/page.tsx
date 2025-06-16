import React from 'react';
import Hero from '@/components/Hero';
import FeaturedProjects from '@/components/FeaturedProjects';
import LatestPosts from '@/components/LatestPosts';
import ContactCTA from '@/components/ContactCTA';

export default function Home() {
  return (
    <>
      <Hero
        title="Crafting Digital Experiences with Passion and Precision"
        subtitle="I'm a full-stack developer specializing in building exceptional digital experiences. Currently, I'm focused on creating accessible, user-friendly web applications."
        ctaText="View My Work"
        ctaLink="/projects"
        secondaryCtaText="Contact Me"
        secondaryCtaLink="/contact"
        imageSrc="https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1172&q=80"
        imageAlt="Developer working on code"
      />
      
      <FeaturedProjects />
      
      <LatestPosts />
      
      <ContactCTA />
    </>
  );
} 