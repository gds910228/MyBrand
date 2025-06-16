"use client";

import React from 'react';
import Link from 'next/link';
import Container from './Container';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedin, faTwitter } from '@fortawesome/free-brands-svg-icons';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Projects', href: '/projects' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ];
  
  const socialLinks = [
    { name: 'GitHub', icon: faGithub, href: 'https://github.com/' },
    { name: 'LinkedIn', icon: faLinkedin, href: 'https://linkedin.com/' },
    { name: 'Twitter', icon: faTwitter, href: 'https://twitter.com/' },
  ];

  return (
    <footer className="bg-neutral-darker text-neutral-light">
      <Container>
        <div className="py-8 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-1">
              <Link href="/" className="text-xl sm:text-2xl font-bold font-heading text-white">
                <span className="text-primary-light">Brand</span>Site
              </Link>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-neutral-muted">
                A professional portfolio and blog website showcasing my work and thoughts.
              </p>
              
              {/* Social Links */}
              <div className="mt-4 sm:mt-6 flex space-x-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-muted hover:text-white transition-colors"
                    aria-label={social.name}
                  >
                    <FontAwesomeIcon icon={social.icon} className="h-5 w-5 sm:h-6 sm:w-6" />
                  </a>
                ))}
              </div>
            </div>
            
            {/* Navigation */}
            <div className="col-span-1">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Navigation</h3>
              <ul className="space-y-2">
                {footerLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm sm:text-base text-neutral-muted hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Quick Links */}
            <div className="col-span-1 hidden sm:block">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/blog" className="text-sm sm:text-base text-neutral-muted hover:text-white transition-colors">
                    Latest Articles
                  </Link>
                </li>
                <li>
                  <Link href="/projects" className="text-sm sm:text-base text-neutral-muted hover:text-white transition-colors">
                    Featured Projects
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-sm sm:text-base text-neutral-muted hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Contact */}
            <div className="col-span-1">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Contact</h3>
              <p className="text-sm sm:text-base text-neutral-muted">
                Feel free to reach out if you have any questions or would like to collaborate.
              </p>
              <p className="mt-2 text-primary-light text-sm sm:text-base">
                hello@example.com
              </p>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-neutral-dark text-center text-xs sm:text-sm text-neutral-muted">
            <p>© {currentYear} BrandSite. All rights reserved.</p>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer; 