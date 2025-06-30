"use client";

import React, { useState, useRef } from 'react';
import Button from './Button';
import emailjs from '@emailjs/browser';

interface ContactFormProps {
  namePlaceholder?: string;
  emailPlaceholder?: string;
  subjectPlaceholder?: string;
  messagePlaceholder?: string;
  submitText?: string;
  successText?: string;
  errorText?: string;
  recipientEmail?: string;
}

const ContactForm: React.FC<ContactFormProps> = ({
  namePlaceholder = "Your Name",
  emailPlaceholder = "Your Email",
  subjectPlaceholder = "Subject",
  messagePlaceholder = "Your Message",
  submitText = "Send Message",
  successText = "Your message has been sent successfully. I'll get back to you soon!",
  errorText = "Oops! Something went wrong. Please try again later.",
  recipientEmail = "1479333689@qq.com"
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic form validation
    if (!name || !email || !subject || !message) {
      alert('Please fill in all fields.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 使用EmailJS发送邮件
      // 环境变量会在构建时注入，在本地开发时使用.env.local，在Vercel部署时使用环境变量
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
      
      console.log('EmailJS配置:', { serviceId, templateId, publicKey: publicKey ? '已设置' : '未设置' });
      
      if (!serviceId || !templateId || !publicKey) {
        throw new Error('EmailJS配置缺失，请检查环境变量');
      }
      
      if (formRef.current) {
        // 添加收件人邮箱到表单数据
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = 'to_email';
        hiddenInput.value = recipientEmail;
        formRef.current.appendChild(hiddenInput);
        
        await emailjs.sendForm(serviceId, templateId, formRef.current, publicKey);
        
        // 移除临时添加的隐藏输入
        formRef.current.removeChild(hiddenInput);
      }
      
      // Reset form
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      
      // Show success message
      setSubmitStatus('success');
      
      // Reset status after 5 seconds
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
      
      // Reset status after 5 seconds
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {submitStatus === 'success' && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">
          {successText}
        </div>
      )}
      
      {submitStatus === 'error' && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
          {errorText}
        </div>
      )}
      
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-dark dark:text-dark-neutral-dark mb-1">
              Name
            </label>
            <input 
              type="text"
              id="name"
              name="user_name" // EmailJS表单字段名
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={namePlaceholder}
              className="w-full px-4 py-3 rounded-lg border border-neutral-muted/30 dark:border-dark-neutral-muted/30 bg-white dark:bg-dark-neutral-light focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-dark dark:text-dark-neutral-dark mb-1">
              Email
            </label>
            <input 
              type="email"
              id="email"
              name="user_email" // EmailJS表单字段名
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={emailPlaceholder}
              className="w-full px-4 py-3 rounded-lg border border-neutral-muted/30 dark:border-dark-neutral-muted/30 bg-white dark:bg-dark-neutral-light focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
              required
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-neutral-dark dark:text-dark-neutral-dark mb-1">
            Subject
          </label>
          <input 
            type="text"
            id="subject"
            name="subject" // EmailJS表单字段名
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={subjectPlaceholder}
            className="w-full px-4 py-3 rounded-lg border border-neutral-muted/30 dark:border-dark-neutral-muted/30 bg-white dark:bg-dark-neutral-light focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
            required
          />
        </div>
        
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-neutral-dark dark:text-dark-neutral-dark mb-1">
            Message
          </label>
          <textarea 
            id="message"
            name="message" // EmailJS表单字段名
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={messagePlaceholder}
            rows={6}
            className="w-full px-4 py-3 rounded-lg border border-neutral-muted/30 dark:border-dark-neutral-muted/30 bg-white dark:bg-dark-neutral-light focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary resize-none"
            required
          />
        </div>
        
        <div className="text-center">
          <Button 
            type="submit" 
            size="lg"
            disabled={isSubmitting}
            className="min-w-[200px]"
          >
            {isSubmitting ? 'Sending...' : submitText}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ContactForm; 