"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
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

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
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
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateField = (fieldName: string, value: string): string | undefined => {
    if (!value || value.trim() === '') {
      return 'This field is required';
    }
    if (fieldName === 'email' && !validateEmail(value)) {
      return 'Please enter a valid email address';
    }
    if (fieldName === 'message' && value.length < 10) {
      return 'Message must be at least 10 characters long';
    }
    return undefined;
  };

  const handleBlur = (fieldName: string, value: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    const error = validateField(fieldName, value);
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  const handleChange = (fieldName: string, value: string) => {
    // Clear error when user starts typing
    if (touched[fieldName]) {
      const error = validateField(fieldName, value);
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: FormErrors = {};
    let hasError = false;

    if (!name || name.trim() === '') {
      newErrors.name = 'This field is required';
      hasError = true;
    }
    if (!email || email.trim() === '') {
      newErrors.email = 'This field is required';
      hasError = true;
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
      hasError = true;
    }
    if (!subject || subject.trim() === '') {
      newErrors.subject = 'This field is required';
      hasError = true;
    }
    if (!message || message.trim() === '') {
      newErrors.message = 'This field is required';
      hasError = true;
    } else if (message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
      hasError = true;
    }

    setErrors(newErrors);
    setTouched({ name: true, email: true, subject: true, message: true });

    if (hasError) {
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
      setTouched({});
      setErrors({});

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
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300"
        >
          {successText}
        </motion.div>
      )}

      {submitStatus === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300"
        >
          {errorText}
        </motion.div>
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
              onChange={(e) => {
                setName(e.target.value);
                handleChange('name', e.target.value);
              }}
              onBlur={() => handleBlur('name', name)}
              placeholder={namePlaceholder}
              className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-dark-neutral-light focus:outline-none focus:ring-2 transition-colors ${
                touched.name && errors.name
                  ? 'border-red-300 dark:border-red-700 focus:ring-red-500 dark:focus:ring-red-400'
                  : 'border-neutral-muted/30 dark:border-dark-neutral-muted/30 focus:ring-primary dark:focus:ring-dark-primary'
              }`}
              aria-invalid={touched.name && errors.name ? 'true' : 'false'}
              aria-describedby={touched.name && errors.name ? 'name-error' : undefined}
            />
            {touched.name && errors.name && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                id="name-error"
                className="mt-1 text-sm text-red-600 dark:text-red-400"
              >
                {errors.name}
              </motion.p>
            )}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-dark dark:text-dark-neutral-dark mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                handleChange('email', e.target.value);
              }}
              onBlur={() => handleBlur('email', email)}
              placeholder={emailPlaceholder}
              className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-dark-neutral-light focus:outline-none focus:ring-2 transition-colors ${
                touched.email && errors.email
                  ? 'border-red-300 dark:border-red-700 focus:ring-red-500 dark:focus:ring-red-400'
                  : 'border-neutral-muted/30 dark:border-dark-neutral-muted/30 focus:ring-primary dark:focus:ring-dark-primary'
              }`}
              aria-invalid={touched.email && errors.email ? 'true' : 'false'}
              aria-describedby={touched.email && errors.email ? 'email-error' : undefined}
            />
            {touched.email && errors.email && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                id="email-error"
                className="mt-1 text-sm text-red-600 dark:text-red-400"
              >
                {errors.email}
              </motion.p>
            )}
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
            onChange={(e) => {
              setSubject(e.target.value);
              handleChange('subject', e.target.value);
            }}
            onBlur={() => handleBlur('subject', subject)}
            placeholder={subjectPlaceholder}
            className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-dark-neutral-light focus:outline-none focus:ring-2 transition-colors ${
              touched.subject && errors.subject
                ? 'border-red-300 dark:border-red-700 focus:ring-red-500 dark:focus:ring-red-400'
                : 'border-neutral-muted/30 dark:border-dark-neutral-muted/30 focus:ring-primary dark:focus:ring-dark-primary'
            }`}
            aria-invalid={touched.subject && errors.subject ? 'true' : 'false'}
            aria-describedby={touched.subject && errors.subject ? 'subject-error' : undefined}
          />
          {touched.subject && errors.subject && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              id="subject-error"
              className="mt-1 text-sm text-red-600 dark:text-red-400"
            >
              {errors.subject}
            </motion.p>
          )}
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-neutral-dark dark:text-dark-neutral-dark mb-1">
            Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleChange('message', e.target.value);
            }}
            onBlur={() => handleBlur('message', message)}
            placeholder={messagePlaceholder}
            rows={6}
            className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-dark-neutral-light focus:outline-none focus:ring-2 transition-colors resize-none ${
              touched.message && errors.message
                ? 'border-red-300 dark:border-red-700 focus:ring-red-500 dark:focus:ring-red-400'
                : 'border-neutral-muted/30 dark:border-dark-neutral-muted/30 focus:ring-primary dark:focus:ring-dark-primary'
            }`}
            aria-invalid={touched.message && errors.message ? 'true' : 'false'}
            aria-describedby={touched.message && errors.message ? 'message-error' : undefined}
          />
          {touched.message && errors.message && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              id="message-error"
              className="mt-1 text-sm text-red-600 dark:text-red-400"
            >
              {errors.message}
            </motion.p>
          )}
          <p className="mt-1 text-xs text-neutral-medium dark:text-dark-neutral-medium">
            {message.length}/10 characters minimum
          </p>
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