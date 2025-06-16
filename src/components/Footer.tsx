"use client";

import React from 'react';
import Link from 'next/link';
import { useTranslations } from '@/i18n/client';
import Container from './Container';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedin, faTwitter } from '@fortawesome/free-brands-svg-icons';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const t = useTranslations();
  const nav = useTranslations('navigation');
  const footer = useTranslations('footer');
  
  const footerLinks = [
    { name: nav('home'), href: '/' },
    { name: nav('about'), href: '/about' },
    { name: nav('projects'), href: '/projects' },
    { name: nav('blog'), href: '/blog' },
    { name: nav('contact'), href: '/contact' },
  ];
  
  const socialLinks = [
    { name: 'GitHub', icon: faGithub, href: 'https://github.com/' },
    { name: 'LinkedIn', icon: faLinkedin, href: 'https://linkedin.com/' },
    { name: 'Twitter', icon: faTwitter, href: 'https://twitter.com/' },
  ];

  return (
    <footer className="bg-neutral-light dark:bg-dark-bg-secondary py-12">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="text-2xl font-bold font-heading text-neutral-darker dark:text-dark-neutral-darker">
              <span className="text-primary dark:text-dark-primary">Brand</span>Site
            </Link>
            <p className="mt-4 text-neutral-dark dark:text-dark-neutral-dark">
              Professional portfolio and blog website showcasing my work and thoughts.
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="text-neutral-dark dark:text-dark-neutral-dark hover:text-primary dark:hover:text-dark-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-4">
              {nav('contact')}
            </h3>
            <p className="text-neutral-dark dark:text-dark-neutral-dark">
              Email: <a href="mailto:hello@example.com" className="hover:text-primary dark:hover:text-dark-primary transition-colors">hello@example.com</a>
            </p>
            <p className="text-neutral-dark dark:text-dark-neutral-dark mt-2">
              Location: San Francisco, CA
            </p>
          </div>

          {/* Social */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-4">
              Follow Me
            </h3>
            <div className="flex space-x-4">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-dark dark:text-dark-neutral-dark hover:text-primary dark:hover:text-dark-primary transition-colors"
                  aria-label={link.name}
                >
                  <FontAwesomeIcon icon={link.icon} className="h-6 w-6" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-6 border-t border-neutral-muted/20 dark:border-dark-neutral-muted/20 text-center">
          <p className="text-neutral-dark dark:text-dark-neutral-dark">
            {footer('copyright').replace('{year}', currentYear.toString())}
          </p>
          <p className="text-neutral-dark dark:text-dark-neutral-dark mt-2 text-sm">
            {footer('madeWith')}
          </p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer; 