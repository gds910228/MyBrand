"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Section from './Section';
import Button from './Button';

const ContactCTA: React.FC = () => {
  const pathname = usePathname();
  const isZhPath = pathname.startsWith('/zh');
  
  // 中英文文本配置
  const texts = {
    en: {
      title: "Let's Work Together",
      description: "Have a project in mind? I'm currently available for freelance work.",
      buttonText: "Get in Touch",
      linkPath: "/contact"
    },
    zh: {
      title: "让我们一起合作",
      description: "有项目想法吗？我目前可接受自由职业工作。",
      buttonText: "联系我",
      linkPath: "/zh/contact"
    }
  };
  
  // 根据当前路径选择语言
  const { title, description, buttonText, linkPath } = isZhPath ? texts.zh : texts.en;
  
  return (
    <Section bgColor="bg-primary dark:bg-dark-primary text-white" className="py-16 lg:py-24">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl lg:text-4xl font-bold font-heading mb-4">
          {title}
        </h2>
        <p className="text-lg opacity-90 max-w-xl mx-auto mb-8">
          {description}
        </p>
        <Link href={linkPath}>
          <Button 
            variant="outline"
            size="lg"
            className="border-white text-white hover:bg-white hover:text-primary dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-dark-primary"
          >
            {buttonText}
          </Button>
        </Link>
      </div>
    </Section>
  );
};

export default ContactCTA; 