"use client";

import React from 'react';
import Section from '@/components/Section';
import Container from '@/components/Container';
import ContactForm from '@/components/ContactForm';
import Image from 'next/image';

export default function ContactPage() {
  return (
    <>
      {/* Hero Section */}
      <Section id="contact-hero" bgColor="bg-neutral-light">
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
          <h1 className="text-4xl md:text-5xl font-bold font-heading text-neutral-darker mb-6">
            Contact MisoTech
          </h1>
          <p className="text-lg text-neutral-dark">
            Have a project in mind or need technical solutions? We're here to help!
          </p>
        </div>
      </Section>
      
      {/* Contact Information Section */}
      <Section id="contact-info">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Contact Details */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold font-heading text-neutral-darker mb-4">
                Contact Information
              </h2>
              <p className="text-neutral-dark mb-6">
                I'm always open to discussing new projects, creative ideas, or opportunities to be part of your vision.
              </p>
            </div>
            
            {/* Email */}
            <div className="flex items-start">
              <div className="bg-neutral-light p-3 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-neutral-darker">Email</h3>
                <a href="mailto:1479333689@qq.com" className="text-primary hover:underline">1479333689@qq.com</a>
              </div>
            </div>
            
            {/* Location */}
            <div className="flex items-start">
              <div className="bg-neutral-light p-3 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-neutral-darker">Location</h3>
                <p className="text-neutral-dark">San Francisco, CA</p>
              </div>
            </div>
            
            {/* Social Media */}
            <div>
              <h3 className="text-lg font-medium text-neutral-darker mb-3">Connect</h3>
              <div className="flex space-x-4">
                {/* GitHub */}
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="bg-neutral-light p-3 rounded-full text-neutral-medium hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
                
                {/* LinkedIn */}
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="bg-neutral-light p-3 rounded-full text-neutral-medium hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
                
                {/* Twitter */}
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="bg-neutral-light p-3 rounded-full text-neutral-medium hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
                
                {/* Dribbble */}
                <a href="https://dribbble.com" target="_blank" rel="noopener noreferrer" className="bg-neutral-light p-3 rounded-full text-neutral-medium hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.628 0-12 5.373-12 12s5.372 12 12 12 12-5.373 12-12-5.372-12-12-12zm9.885 11.441c-2.575-.422-4.943-.445-7.103-.073-.244-.563-.497-1.125-.767-1.68 2.31-1 4.165-2.358 5.548-4.082 1.35 1.594 2.197 3.619 2.322 5.835zm-3.842-7.282c-1.205 1.554-2.868 2.783-4.986 3.68-1.016-1.861-2.178-3.676-3.488-5.438.779-.197 1.591-.314 2.431-.314 2.275 0 4.368.779 6.043 2.072zm-10.516-.993c1.331 1.742 2.511 3.538 3.537 5.381-2.43.715-5.331 1.082-8.684 1.105.692-2.835 2.601-5.193 5.147-6.486zm-5.44 8.834l.013-.256c3.849-.005 7.169-.448 9.95-1.322.233.475.456.952.67 1.432-3.38 1.057-6.165 3.222-8.337 6.48-1.432-1.719-2.296-3.927-2.296-6.334zm3.829 7.81c1.969-3.088 4.482-5.098 7.598-6.027.928 2.42 1.609 4.91 2.043 7.46-3.349 1.291-6.953.666-9.641-1.433zm11.586.43c-.438-2.353-1.08-4.653-1.92-6.897 1.876-.265 3.94-.196 6.199.196-.437 2.786-2.028 5.192-4.279 6.701z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          {/* Contact Form */}
          <div className="bg-white dark:bg-dark-bg-secondary p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-6">
              <Image
                src="/images/MisoTech-Logo.png"
                alt="MisoTech Logo"
                width={40}
                height={40}
                className="mr-3"
              />
              <h2 className="text-2xl font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker">
                Send Me a Message
              </h2>
            </div>
            
            <ContactForm 
              namePlaceholder="Your Name" 
              emailPlaceholder="Your Email" 
              subjectPlaceholder="Subject" 
              messagePlaceholder="Your Message" 
              submitText="Send Message"
              successText="Your message has been sent successfully. I'll get back to you soon!"
              errorText="Oops! Something went wrong. Please try again later."
            />
          </div>
        </div>
      </Section>
      
      {/* FAQ Section */}
      <Section id="faq" bgColor="bg-neutral-light">
        <Container>
          <div className="flex items-center justify-center mb-12">
            <Image
              src="/images/MisoTech-Logo.png"
              alt="MisoTech Logo"
              width={50}
              height={50}
              className="mr-4"
            />
            <h2 className="text-3xl font-bold font-heading text-neutral-darker">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-dark-bg-secondary p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-3">What services do you offer?</h3>
              <p className="text-neutral-dark dark:text-dark-neutral-dark">I provide a range of web development services including custom website design, web application development, e-commerce solutions, and technical consulting. Each project is tailored to meet your specific needs and business goals.</p>
            </div>
            
            <div className="bg-white dark:bg-dark-bg-secondary p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-3">How much does a typical project cost?</h3>
              <p className="text-neutral-dark dark:text-dark-neutral-dark">Project costs vary depending on the scope, complexity, and timeline. I offer competitive rates and work with you to find a solution that fits your budget. Contact me for a free consultation and quote.</p>
            </div>
            
            <div className="bg-white dark:bg-dark-bg-secondary p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-3">How long does it take to complete a project?</h3>
              <p className="text-neutral-dark dark:text-dark-neutral-dark">Timeline depends on the project scope and complexity. A simple website might take 2-4 weeks, while a complex web application could take several months. I always provide a detailed timeline before starting any project.</p>
            </div>
            
            <div className="bg-white dark:bg-dark-bg-secondary p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-3">Do you offer ongoing maintenance?</h3>
              <p className="text-neutral-dark dark:text-dark-neutral-dark">Yes, I offer various maintenance packages to keep your website or application running smoothly after launch. These can include regular updates, security checks, and performance optimizations.</p>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
} 