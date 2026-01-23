"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import Container from './Container';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import SearchButton from './SearchButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';

// 硬编码的导航链接
const navLinksEn = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Projects', href: '/projects' },
  { name: 'Blog', href: '/blog' },
  { name: 'Contact', href: '/contact' },
  { name: 'Privacy', href: '/privacy' },
  { name: 'Disclaimer', href: '/disclaimer' },
];

const navLinksZh = [
  { name: '首页', href: '/zh' },
  { name: '关于', href: '/zh/about' },
  { name: '项目', href: '/zh/projects' },
  { name: '博客', href: '/zh/blog' },
  { name: '联系', href: '/zh/contact' },
  { name: '隐私政策', href: '/zh/privacy' },
  { name: '免责声明', href: '/zh/disclaimer' },
];

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  // 根据路径确定当前语言
  const locale = pathname.startsWith('/zh') ? 'zh' : 'en';
  const navLinks = locale === 'zh' ? navLinksZh : navLinksEn;

  // Handle scroll event to change navbar style
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 检查链接是否活跃
  const isActiveLink = (href: string): boolean => {
    if (href === '/' && pathname === '/') return true;
    if (href === '/zh' && pathname === '/zh') return true;
    if (href !== '/' && href !== '/zh' && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-white/95 dark:bg-deep-charcoal/95 backdrop-blur-md shadow-lg shadow-neon-orange/5 py-3 border-b border-neutral-200 dark:border-metallic/10'
          : 'bg-transparent py-5'
      }`}
    >
      <Container>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href={locale === 'zh' ? '/zh' : '/'}
            className="flex items-center text-2xl font-bold font-heading text-neutral-darker dark:text-white group transition-smooth"
          >
            <div className="w-10 h-10 mr-2 relative group-hover:scale-110 transition-transform duration-300">
              <Image
                src="/images/MisoTech-Logo.png"
                alt="MisoTech Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <span className="gradient-text group-hover:neon-text transition-all duration-300">
              Miso
            </span><span className="text-neutral-dark dark:text-metallic group-hover:text-neutral-darker dark:group-hover:text-white transition-colors duration-300">Tech</span>
            <span className="text-xs ml-2 text-neutral-medium dark:text-metallic font-normal hidden sm:inline-block opacity-70 group-hover:opacity-100 transition-opacity font-mono">
              &lt;Decode /&gt;
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <nav className="flex space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-medium transition-all duration-300 relative group py-2 px-3 rounded-lg font-mono tracking-wide ${
                    isActiveLink(link.href)
                      ? 'text-neon-orange bg-neon-orange/5 dark:bg-neon-orange/10 border border-neon-orange/20'
                      : 'text-neutral-dark dark:text-metallic hover:text-neon-orange dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-metallic/5'
                  }`}
                >
                  {link.name}
                  {/* Active indicator */}
                  {isActiveLink(link.href) && (
                    <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-neon-orange rounded-full animate-pulse"></span>
                  )}
                </Link>
              ))}
            </nav>

            {/* Search Button */}
            <SearchButton locale={locale} />

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button and Theme Toggle */}
          <div className="md:hidden flex items-center space-x-2">
            <SearchButton locale={locale} />
            <LanguageSwitcher />
            <ThemeToggle />
            <button
              className="p-2 rounded-lg text-neutral-dark dark:text-metallic hover:text-neon-orange dark:hover:text-neon-orange hover:bg-neutral-100 dark:hover:bg-metallic/5 transition-colors duration-300 border border-transparent hover:border-neon-orange/20"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation - Enhanced with animation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="md:hidden mt-4 pb-4 overflow-hidden"
          >
            <nav className="flex flex-col space-y-1">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                >
                  <Link
                    href={link.href}
                    className={`block text-sm font-medium transition-all duration-300 px-4 py-3 rounded-lg font-mono tracking-wide ${
                      isActiveLink(link.href)
                        ? 'text-neon-orange bg-neon-orange/5 dark:bg-neon-orange/10 border border-neon-orange/20'
                        : 'text-neutral-dark dark:text-metallic hover:text-neon-orange dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-metallic/5'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </Container>
    </header>
  );
};

export default Navbar; 