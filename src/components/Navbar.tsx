"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import Container from './Container';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';

// 硬编码的导航链接
const navLinksEn = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Projects', href: '/projects' },
  { name: 'Blog', href: '/blog' },
  { name: 'Contact', href: '/contact' },
];

const navLinksZh = [
  { name: '首页', href: '/zh' },
  { name: '关于', href: '/zh/about' },
  { name: '项目', href: '/zh/projects' },
  { name: '博客', href: '/zh/blog' },
  { name: '联系', href: '/zh/contact' },
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white dark:bg-dark-bg-primary shadow-md dark:shadow-neutral-black/30 py-3' 
          : 'bg-transparent py-5'
      }`}
    >
      <Container>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href={locale === 'zh' ? '/zh' : '/'} className="flex items-center text-2xl font-bold font-heading text-neutral-darker dark:text-dark-neutral-darker">
            <div className="w-10 h-10 mr-2 relative">
              <Image 
                src="/images/MisoTech-Logo.png" 
                alt="MisoTech Logo" 
                width={40} 
                height={40} 
                className="object-contain"
              />
            </div>
            <span className="text-primary dark:text-dark-primary">Miso</span>Tech
            <span className="text-xs ml-2 text-neutral-dark dark:text-dark-neutral-dark font-normal hidden sm:inline-block">Decode the Stack</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <nav className="flex space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-base font-medium transition-colors hover:text-primary dark:hover:text-dark-primary ${
                    isActiveLink(link.href)
                      ? 'text-primary dark:text-dark-primary'
                      : 'text-neutral-dark dark:text-dark-neutral-dark'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
            
            {/* Language Switcher */}
            <LanguageSwitcher />
            
            {/* Theme Toggle */}
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button and Theme Toggle */}
          <div className="md:hidden flex items-center space-x-2">
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

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4">
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-base font-medium transition-colors hover:text-primary dark:hover:text-dark-primary px-2 py-1 rounded-md ${
                    isActiveLink(link.href)
                      ? 'text-primary dark:text-dark-primary bg-neutral-light dark:bg-dark-neutral-light'
                      : 'text-neutral-dark dark:text-dark-neutral-dark'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </Container>
    </header>
  );
};

export default Navbar; 