"use client";

import React from 'react';
import Section from '@/components/Section';
import SectionHeading from '@/components/SectionHeading';
import ContactForm from '@/components/ContactForm';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPhone, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { faGithub, faLinkedin, faTwitter } from '@fortawesome/free-brands-svg-icons';
import Image from 'next/image';

export default function ContactPageZh() {
  return (
    <>
      {/* Hero Section */}
      <Section id="contact-hero" bgColor="bg-neutral-light dark:bg-dark-bg-secondary">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/images/MisoTech-Logo.png"
              alt="MisoTech Logo"
              width={120}
              height={120}
              priority
            />
          </div>
          <SectionHeading 
            title="联系 MisoTech" 
            subtitle="有技术需求或项目合作？我们随时为您提供帮助！" 
            centered
          />
        </div>
      </Section>
      
      {/* Contact Information */}
      <Section id="contact-info">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 shadow-md text-center"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-light dark:bg-dark-primary-light text-primary dark:text-dark-primary rounded-full mb-4">
              <FontAwesomeIcon icon={faEnvelope} className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-2">
              电子邮件
            </h3>
            <p className="text-neutral-dark dark:text-dark-neutral-dark">
              <a href="mailto:1479333689@qq.com" className="hover:text-primary dark:hover:text-dark-primary transition-colors">1479333689@qq.com</a>
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 shadow-md text-center"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-light dark:bg-dark-primary-light text-primary dark:text-dark-primary rounded-full mb-4">
              <FontAwesomeIcon icon={faPhone} className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-2">
              电话
            </h3>
            <p className="text-neutral-dark dark:text-dark-neutral-dark">
              <a href="tel:+18001234567" className="hover:text-primary dark:hover:text-dark-primary transition-colors">+1 (800) 123-4567</a>
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 shadow-md text-center"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-light dark:bg-dark-primary-light text-primary dark:text-dark-primary rounded-full mb-4">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-2">
              地址
            </h3>
            <p className="text-neutral-dark dark:text-dark-neutral-dark">
              旧金山，加利福尼亚州
            </p>
          </motion.div>
        </div>
      </Section>
      
      {/* Social Media */}
      <Section id="social-media" bgColor="bg-white dark:bg-dark-bg-primary">
        <div className="text-center mb-8">
          <SectionHeading 
            title="社交媒体" 
            subtitle="在社交媒体上与我们联系" 
            centered
          />
        </div>
        
        <div className="flex flex-wrap justify-center gap-6">
          <motion.a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-16 h-16 bg-neutral-light dark:bg-dark-bg-secondary rounded-full text-neutral-darker dark:text-dark-neutral-lighter hover:text-primary dark:hover:text-dark-primary transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <FontAwesomeIcon icon={faGithub} className="h-8 w-8" />
          </motion.a>
          
          <motion.a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-16 h-16 bg-neutral-light dark:bg-dark-bg-secondary rounded-full text-neutral-darker dark:text-dark-neutral-lighter hover:text-primary dark:hover:text-dark-primary transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <FontAwesomeIcon icon={faLinkedin} className="h-8 w-8" />
          </motion.a>
          
          <motion.a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-16 h-16 bg-neutral-light dark:bg-dark-bg-secondary rounded-full text-neutral-darker dark:text-dark-neutral-lighter hover:text-primary dark:hover:text-dark-primary transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <FontAwesomeIcon icon={faTwitter} className="h-8 w-8" />
          </motion.a>
        </div>
      </Section>
      
      {/* Contact Form */}
      <Section id="contact-form" bgColor="bg-neutral-light dark:bg-dark-bg-secondary">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Image
              src="/images/MisoTech-Logo.png"
              alt="MisoTech Logo"
              width={60}
              height={60}
              className="mr-4"
            />
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-neutral-darker dark:text-dark-neutral-darker">
              发送消息
            </h2>
          </div>
          <p className="text-neutral-dark dark:text-dark-neutral-dark text-center mb-8">
            请填写以下表单，我会尽快回复您。
          </p>
          
          <ContactForm 
            namePlaceholder="您的姓名" 
            emailPlaceholder="您的电子邮件" 
            subjectPlaceholder="主题" 
            messagePlaceholder="您的消息" 
            submitText="发送消息"
            successText="您的消息已成功发送。我会尽快回复您！"
            errorText="抱歉！发生了错误。请稍后再试。"
          />
        </div>
      </Section>
    </>
  );
} 