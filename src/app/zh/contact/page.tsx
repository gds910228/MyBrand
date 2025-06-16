"use client";

import React from 'react';
import Section from '@/components/Section';
import SectionHeading from '@/components/SectionHeading';
import ContactForm from '@/components/ContactForm';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPhone, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { faGithub, faLinkedin, faTwitter } from '@fortawesome/free-brands-svg-icons';

export default function ContactPageZh() {
  return (
    <>
      {/* Hero Section */}
      <Section id="contact-hero" bgColor="bg-neutral-light dark:bg-dark-bg-secondary">
        <div className="mx-auto max-w-3xl text-center">
          <SectionHeading 
            title="联系我" 
            subtitle="让我们讨论您的下一个项目，或者只是打个招呼！" 
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
              <a href="mailto:hello@example.com" className="hover:text-primary dark:hover:text-dark-primary transition-colors">hello@example.com</a>
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 shadow-md text-center"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-light dark:bg-dark-primary-light text-primary dark:text-dark-primary rounded-full mb-4">
              <FontAwesomeIcon icon={faPhone} className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-2">
              电话
            </h3>
            <p className="text-neutral-dark dark:text-dark-neutral-dark">
              <a href="tel:+11234567890" className="hover:text-primary dark:hover:text-dark-primary transition-colors">+1 (123) 456-7890</a>
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
              <FontAwesomeIcon icon={faMapMarkerAlt} className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-2">
              位置
            </h3>
            <p className="text-neutral-dark dark:text-dark-neutral-dark">
              旧金山, 加利福尼亚
            </p>
          </motion.div>
        </div>
        
        {/* Social Media Links */}
        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-4">
            在社交媒体上关注我
          </h3>
          <div className="flex justify-center space-x-6">
            <a
              href="https://github.com/example"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-dark dark:text-dark-neutral-dark hover:text-primary dark:hover:text-dark-primary transition-colors"
              aria-label="GitHub"
            >
              <FontAwesomeIcon icon={faGithub} className="h-8 w-8" />
            </a>
            <a
              href="https://linkedin.com/in/example"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-dark dark:text-dark-neutral-dark hover:text-primary dark:hover:text-dark-primary transition-colors"
              aria-label="LinkedIn"
            >
              <FontAwesomeIcon icon={faLinkedin} className="h-8 w-8" />
            </a>
            <a
              href="https://twitter.com/example"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-dark dark:text-dark-neutral-dark hover:text-primary dark:hover:text-dark-primary transition-colors"
              aria-label="Twitter"
            >
              <FontAwesomeIcon icon={faTwitter} className="h-8 w-8" />
            </a>
          </div>
        </div>
      </Section>
      
      {/* Contact Form */}
      <Section id="contact-form" bgColor="bg-neutral-light dark:bg-dark-bg-secondary">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-6 text-center">
            发送消息
          </h2>
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