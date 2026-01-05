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
          ? 'bg-white/90 dark:bg-dark-bg-primary/90 backdrop-blur-md shadow-lg dark:shadow-neutral-black/30 py-3 border-b border-neutral-200/50 dark:border-neutral-700/50'
          : 'bg-transparent py-5'
      }`}
    >
      <Container>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href={locale === 'zh' ? '/zh' : '/'}
            className="flex items-center text-2xl font-bold font-heading text-neutral-darker dark:text-dark-neutral-darker group transition-smooth"
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
            <span className="bg-gradient-to-r from-primary to-primary-dark dark:from-dark-primary dark:to-dark-primary-dark bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
              Miso
            </span><span className="text-neutral-darker dark:text-dark-neutral-darker">Tech</span>
            <span className="text-xs ml-2 text-neutral-dark dark:text-dark-neutral-dark font-normal hidden sm:inline-block opacity-70 group-hover:opacity-100 transition-opacity">
              Decode the Stack
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <nav className="flex space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-base font-medium transition-all duration-300 relative group py-2 ${
                    isActiveLink(link.href)
                      ? 'text-primary dark:text-dark-primary'
                      : 'text-neutral-dark dark:text-dark-neutral-dark hover:text-primary dark:hover:text-dark-primary'
                  }`}
                >
                  {link.name}
                  {/* Underline animation */}
                  <span className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary to-primary-dark dark:from-dark-primary dark:to-dark-primary-dark transition-all duration-300 ${
                    isActiveLink(link.href) ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
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
              className="p-2 rounded-md text-neutral-dark dark:text-dark-neutral-dark hover:text-primary dark:hover:text-dark-primary hover:bg-neutral-light dark:hover:bg-dark-neutral-light"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} className="h-6 w-6" />
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
            <nav className="flex flex-col space-y-2">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                >
                  <Link
                    href={link.href}
                    className={`block text-base font-medium transition-all duration-300 hover:text-primary dark:hover:text-dark-primary px-3 py-2.5 rounded-lg ${
                      isActiveLink(link.href)
                        ? 'text-primary dark:text-dark-primary bg-primary/10 dark:bg-dark-primary/10'
                        : 'text-neutral-dark dark:text-dark-neutral-dark hover:bg-neutral-light/50 dark:hover:bg-dark-neutral-light/50'
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