"use client";

import React from 'react';
import Section from './Section';
import Button from './Button';

const ContactCTA: React.FC = () => {
  return (
    <Section id="contact-cta" bgColor="bg-primary" spacing="md">
      <div className="text-center text-white px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-heading">
          Let's Work Together
        </h2>
        <p className="mt-3 sm:mt-4 text-base sm:text-lg text-white/80 max-w-2xl mx-auto">
          Have a project in mind or just want to chat? I'm always open to new opportunities and collaborations.
        </p>
        <div className="mt-6 sm:mt-8 md:mt-10">
          <Button
            href="/contact"
            variant="outline"
            size="lg"
            className="border-white text-white hover:bg-white hover:text-primary"
          >
            Get in Touch
          </Button>
        </div>
      </div>
    </Section>
  );
};

export default ContactCTA; 