"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import Container from './Container';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons';

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
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Disclaimer', href: '/disclaimer' },
  ];
  
  const footerLinksZh = [
    { name: '首页', href: '/zh' },
    { name: '关于', href: '/zh/about' },
    { name: '项目', href: '/zh/projects' },
    { name: '博客', href: '/zh/blog' },
    { name: '联系', href: '/zh/contact' },
    { name: '隐私政策', href: '/zh/privacy' },
    { name: '免责声明', href: '/zh/disclaimer' },
  ];
  
  const footerLinks = locale === 'zh' ? footerLinksZh : footerLinksEn;
  const contactLabel = locale === 'zh' ? '联系' : 'Contact';
  
  const socialLinks = [
    { name: 'GitHub', icon: faGithub, href: 'https://github.com/gds910228' },
    { name: 'Twitter', icon: faTwitter, href: 'https://x.com/BobXu350839133' },
  ];
  
  // 页脚版权和制作信息
  const copyright = locale === 'zh' 
    ? `© ${currentYear} MisoTech. 保留所有权利。` 
    : `© ${currentYear} MisoTech. All rights reserved.`;
    
  const madeWith = locale === 'zh'
    ? '使用 Next.js 和 Tailwind CSS 制作，充满❤️'
    : 'Made with ❤️ using Next.js and Tailwind CSS';

  return (
    <footer className="bg-neutral-light dark:bg-dark-bg-secondary py-12">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link href={locale === 'zh' ? '/zh' : '/'} className="flex items-center text-2xl font-bold font-heading text-neutral-darker dark:text-dark-neutral-darker">
              <div className="w-8 h-8 mr-2 relative">
                <Image 
                  src="/images/MisoTech-Logo.png" 
                  alt="MisoTech Logo" 
                  width={32} 
                  height={32} 
                  className="object-contain"
                />
              </div>
              <span className="text-primary dark:text-dark-primary">Miso</span>Tech
            </Link>
            <p className="mt-2 text-xs text-neutral-dark dark:text-dark-neutral-dark">
              Decode the Stack
            </p>
            <p className="mt-4 text-neutral-dark dark:text-dark-neutral-dark">
              {locale === 'zh' 
                ? '专业技术解决方案和见解，帮助您解码技术栈。'
                : 'Professional technology solutions and insights to help you decode the stack.'}
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
              Email: <a href="mailto:1479333689@qq.com" className="hover:text-primary dark:hover:text-dark-primary transition-colors">1479333689@qq.com</a>
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