"use client";

import React, { useState } from 'react';
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 基本验证
    if (!name || !email || !subject || !message) {
      alert('Please fill in all fields.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
      
      if (!publicKey) {
        throw new Error('Missing EmailJS public key');
      }
      
      // 必要的服务ID和模板ID
      const serviceID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
      const templateID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
      
      if (!serviceID || !templateID) {
        throw new Error('Missing EmailJS service ID or template ID');
      }
      
      // 准备模板参数 - 使用EmailJS推荐的标准字段名
      const templateParams = {
        // 这些是EmailJS默认识别的字段
        from_name: name,
        reply_to: email,  // 这是关键 - 用于回复的邮箱
        subject: subject,
        message: message,
        // 如果模板中需要自定义收件人
        to_email: recipientEmail,
        to_name: "MisoTech" // 收件人名称
      };
      
      // 初始化EmailJS
      emailjs.init({ publicKey });
      
      // 直接发送邮件 - 使用最简单的send方法
      const result = await emailjs.send(
        serviceID, 
        templateID, 
        templateParams
      );
      
      // 重置表单
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      
      // 显示成功信息
      setSubmitStatus('success');
      
      // 5秒后重置状态
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);
    } catch (error: any) {
      console.error('Email sending error:', error);
      setSubmitStatus('error');
      
      // 5秒后重置状态
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
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-dark dark:text-dark-neutral-dark mb-1">
              Name
            </label>
            <input 
              type="text"
              id="name"
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