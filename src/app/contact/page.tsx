"use client";

import React from 'react';
import Section from '@/components/Section';
import SectionHeading from '@/components/SectionHeading';
import ContactForm from '@/components/ContactForm';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faMapMarkerAlt, faClock } from '@fortawesome/free-solid-svg-icons';
import { faGithub, faTwitter, faLinkedin } from '@fortawesome/free-brands-svg-icons';

export default function ContactPage() {
  return (
    <>
      {/* Hero Section */}
      <Section id="contact-hero" bgColor="bg-neutral-light dark:bg-dark-bg-secondary">
        <div className="text-center max-w-3xl mx-auto">
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
            title="Contact MisoTech"
            subtitle="Have a project in mind or need technical solutions? We're here to help!"
            centered
          />
        </div>
      </Section>

      {/* Contact Information Cards */}
      <Section id="contact-info">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Email Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 shadow-md text-center hover:shadow-lg transition-shadow"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-light/20 dark:bg-dark-primary-light/20 text-primary dark:text-dark-primary rounded-full mb-4">
              <FontAwesomeIcon icon={faEnvelope} className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-2">
              Email
            </h3>
            <a href="mailto:1479333689@qq.com" className="text-primary dark:text-dark-primary hover:underline break-all">
              1479333689@qq.com
            </a>
          </motion.div>

          {/* Location Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 shadow-md text-center hover:shadow-lg transition-shadow"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-light/20 dark:bg-dark-primary-light/20 text-primary dark:text-dark-primary rounded-full mb-4">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-2">
              Location
            </h3>
            <p className="text-neutral-dark dark:text-dark-neutral-dark">
              San Francisco, CA
            </p>
          </motion.div>

          {/* Response Time Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 shadow-md text-center hover:shadow-lg transition-shadow"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-light/20 dark:bg-dark-primary-light/20 text-primary dark:text-dark-primary rounded-full mb-4">
              <FontAwesomeIcon icon={faClock} className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-2">
              Response Time
            </h3>
            <p className="text-neutral-dark dark:text-dark-neutral-dark">
              Within 24 hours
            </p>
          </motion.div>
        </div>
      </Section>

      {/* Social Media Section */}
      <Section id="social-media" bgColor="bg-white dark:bg-dark-bg-primary">
        <div className="text-center mb-8">
          <SectionHeading
            title="Connect With Me"
            subtitle="Follow me on social media"
            centered
          />
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          <motion.a
            href="https://github.com/gds910228"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-16 h-16 bg-neutral-light dark:bg-dark-bg-secondary rounded-full text-neutral-darker dark:text-dark-neutral-lighter hover:text-primary dark:hover:text-dark-primary transition-colors hover:scale-110"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: 0.1 }}
            aria-label="GitHub"
          >
            <FontAwesomeIcon icon={faGithub} className="h-8 w-8" />
          </motion.a>

          <motion.a
            href="https://x.com/ArcherRealAI"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-16 h-16 bg-neutral-light dark:bg-dark-bg-secondary rounded-full text-neutral-darker dark:text-dark-neutral-lighter hover:text-primary dark:hover:text-dark-primary transition-colors hover:scale-110"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: 0.2 }}
            aria-label="Twitter/X"
          >
            <FontAwesomeIcon icon={faTwitter} className="h-8 w-8" />
          </motion.a>

          <motion.a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-16 h-16 bg-neutral-light dark:bg-dark-bg-secondary rounded-full text-neutral-darker dark:text-dark-neutral-lighter hover:text-primary dark:hover:text-dark-primary transition-colors hover:scale-110"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: 0.3 }}
            aria-label="LinkedIn"
          >
            <FontAwesomeIcon icon={faLinkedin} className="h-8 w-8" />
          </motion.a>
        </div>
      </Section>

      {/* Contact Form */}
      <Section id="contact-form" bgColor="bg-neutral-light dark:bg-dark-bg-secondary">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <SectionHeading
              title="Send Me a Message"
              subtitle="I'll get back to you as soon as possible"
              centered
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-dark-bg-primary p-6 sm:p-8 rounded-xl shadow-lg"
          >
            <ContactForm
              namePlaceholder="Your Name"
              emailPlaceholder="Your Email"
              subjectPlaceholder="Subject"
              messagePlaceholder="Your Message"
              submitText="Send Message"
              successText="Your message has been sent successfully. I'll get back to you soon!"
              errorText="Oops! Something went wrong. Please try again later."
            />
          </motion.div>
        </div>
      </Section>

      {/* FAQ Section */}
      <Section id="faq" bgColor="bg-white dark:bg-dark-bg-primary">
        <div className="text-center mb-12">
          <SectionHeading
            title="Frequently Asked Questions"
            centered
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-neutral-light dark:bg-dark-bg-secondary p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
          >
            <h3 className="text-xl font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-3">What services do you offer?</h3>
            <p className="text-neutral-dark dark:text-dark-neutral-dark">I provide a range of web development services including custom website design, web application development, e-commerce solutions, and technical consulting. Each project is tailored to meet your specific needs and business goals.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-neutral-light dark:bg-dark-bg-secondary p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
          >
            <h3 className="text-xl font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-3">How much does a typical project cost?</h3>
            <p className="text-neutral-dark dark:text-dark-neutral-dark">Project costs vary depending on the scope, complexity, and timeline. I offer competitive rates and work with you to find a solution that fits your budget. Contact me for a free consultation and quote.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-neutral-light dark:bg-dark-bg-secondary p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
          >
            <h3 className="text-xl font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-3">How long does it take to complete a project?</h3>
            <p className="text-neutral-dark dark:text-dark-neutral-dark">Timeline depends on the project scope and complexity. A simple website might take 2-4 weeks, while a complex web application could take several months. I always provide a detailed timeline before starting any project.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-neutral-light dark:bg-dark-bg-secondary p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
          >
            <h3 className="text-xl font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-3">Do you offer ongoing maintenance?</h3>
            <p className="text-neutral-dark dark:text-dark-neutral-dark">Yes, I offer various maintenance packages to keep your website or application running smoothly after launch. These can include regular updates, security checks, and performance optimizations.</p>
          </motion.div>
        </div>
      </Section>
    </>
  );
}