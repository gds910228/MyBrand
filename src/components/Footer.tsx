"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Container from './Container';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedin, faTwitter } from '@fortawesome/free-brands-svg-icons';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const locale = pathname.startsWith('/zh') ? 'zh' : 'en';
  
  // 硬编码的导航链接
  const footerLinksEn = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Projects', href: '/projects' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ];
  
  const footerLinksZh = [
    { name: '首页', href: '/' },
    { name: '关于', href: '/about' },
    { name: '项目', href: '/projects' },
    { name: '博客', href: '/blog' },
    { name: '联系', href: '/contact' },
  ];
  
  const footerLinks = locale === 'zh' ? footerLinksZh : footerLinksEn;
  const contactLabel = locale === 'zh' ? '联系' : 'Contact';
  
  const socialLinks = [
    { name: 'GitHub', icon: faGithub, href: 'https://github.com/' },
    { name: 'LinkedIn', icon: faLinkedin, href: 'https://linkedin.com/' },
    { name: 'Twitter', icon: faTwitter, href: 'https://twitter.com/' },
  ];
  
  // 页脚版权和制作信息
  const copyright = locale === 'zh' 
    ? `© ${currentYear} John Doe. 保留所有权利。` 
    : `© ${currentYear} John Doe. All rights reserved.`;
    
  const madeWith = locale === 'zh'
    ? '使用 Next.js 和 Tailwind CSS 制作，充满❤️'
    : 'Made with ❤️ using Next.js and Tailwind CSS';

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
              {locale === 'zh' 
                ? '展示我的作品和想法的个人作品集和博客网站。'
                : 'Professional portfolio and blog website showcasing my work and thoughts.'}
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-4">
              {locale === 'zh' ? '快速链接' : 'Quick Links'}
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
              {contactLabel}
            </h3>
            <p className="text-neutral-dark dark:text-dark-neutral-dark">
              Email: <a href="mailto:hello@example.com" className="hover:text-primary dark:hover:text-dark-primary transition-colors">hello@example.com</a>
            </p>
            <p className="text-neutral-dark dark:text-dark-neutral-dark mt-2">
              {locale === 'zh' ? '地址: ' : 'Location: '} San Francisco, CA
            </p>
          </div>

          {/* Social */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-4">
              {locale === 'zh' ? '关注我' : 'Follow Me'}
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
            {copyright}
          </p>
          <p className="text-neutral-dark dark:text-dark-neutral-dark mt-2 text-sm">
            {madeWith}
          </p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer; 