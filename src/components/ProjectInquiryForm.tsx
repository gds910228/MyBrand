"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import emailjs from '@emailjs/browser';
import Button from './Button';
import { SERVICES } from '@/data/services';

type Locale = 'en' | 'zh';

interface ProjectInquiryFormProps {
  locale: Locale;
  recipientEmail?: string;
}

interface FormState {
  name: string;
  email: string;
  company: string;
  backupContact: string;
  serviceType: string;
  budget: string;
  timeline: string;
  description: string;
  referral: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  serviceType?: string;
  budget?: string;
  timeline?: string;
  description?: string;
}

const INITIAL_STATE: FormState = {
  name: '',
  email: '',
  company: '',
  backupContact: '',
  serviceType: '',
  budget: '',
  timeline: '',
  description: '',
  referral: '',
};

const ProjectInquiryForm: React.FC<ProjectInquiryFormProps> = ({
  locale,
  recipientEmail = '1479333689@qq.com',
}) => {
  const t = SERVICES[locale].inquiry;
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateField = (name: keyof FormState, value: string): string | undefined => {
    const required = locale === 'zh' ? '此项必填' : 'This field is required';
    const invalidEmail = locale === 'zh' ? '请输入有效的邮箱地址' : 'Please enter a valid email';
    const minDesc = locale === 'zh' ? '至少 30 个字符' : 'At least 30 characters';

    if (name === 'name' || name === 'serviceType' || name === 'budget' || name === 'timeline') {
      if (!value.trim()) return required;
    }
    if (name === 'email') {
      if (!value.trim()) return required;
      if (!validateEmail(value)) return invalidEmail;
    }
    if (name === 'description') {
      if (!value.trim()) return required;
      if (value.trim().length < 30) return minDesc;
    }
    return undefined;
  };

  const update = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const blur = (field: keyof FormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, form[field]) }));
  };

  // Map option `value` codes to their human-readable labels for the email body
  const labelFor = (
    list: { value: string; label: string }[],
    value: string,
  ): string => list.find((o) => o.value === value)?.label ?? value;

  const composeMessageBody = (): { subject: string; message: string } => {
    const serviceLabel = labelFor(t.options.serviceTypes, form.serviceType);
    const budgetLabel = labelFor(t.options.budgets, form.budget);
    const timelineLabel = labelFor(t.options.timelines, form.timeline);
    const referralLabel = form.referral
      ? labelFor(t.options.referrals, form.referral)
      : '-';

    const subject = `[Project Inquiry] ${serviceLabel} — ${form.name}`;

    const lines = [
      '==== PROJECT INQUIRY ====',
      `Service Type:  ${serviceLabel}`,
      `Budget:        ${budgetLabel}`,
      `Timeline:      ${timelineLabel}`,
      `Company:       ${form.company || '-'}`,
      `WeChat/TG:     ${form.backupContact || '-'}`,
      `Referral:      ${referralLabel}`,
      '',
      '---- Description ----',
      form.description,
      '',
      '---- Contact ----',
      `Name:   ${form.name}`,
      `Email:  ${form.email}`,
    ];

    return { subject, message: lines.join('\n') };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all required fields
    const fieldsToValidate: (keyof FormState)[] = [
      'name', 'email', 'serviceType', 'budget', 'timeline', 'description',
    ];
    const newErrors: FormErrors = {};
    let hasError = false;
    fieldsToValidate.forEach((f) => {
      const err = validateField(f, form[f]);
      if (err) {
        newErrors[f as keyof FormErrors] = err;
        hasError = true;
      }
    });
    setErrors(newErrors);
    setTouched(fieldsToValidate.reduce((acc, f) => ({ ...acc, [f]: true }), {}));

    if (hasError) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
      const serviceID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
      const templateID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;

      if (!publicKey || !serviceID || !templateID) {
        throw new Error('Missing EmailJS configuration');
      }

      const { subject, message } = composeMessageBody();

      emailjs.init({ publicKey });
      await emailjs.send(serviceID, templateID, {
        from_name: form.name,
        reply_to: form.email,
        subject,
        message,
        to_email: recipientEmail,
        to_name: 'MisoTech',
      });

      setForm(INITIAL_STATE);
      setTouched({});
      setErrors({});
      setSubmitStatus('success');
      setTimeout(() => setSubmitStatus('idle'), 8000);
    } catch (err) {
      console.error('Project inquiry submission failed:', err);
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 8000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Reusable UI primitives (scoped to this component) ──────────────────────

  const inputClass = (hasError?: string) =>
    `w-full px-4 py-3 rounded-lg border bg-white dark:bg-deep-charcoal/60 text-neutral-darker dark:text-white placeholder:text-neutral-medium dark:placeholder:text-metallic focus:outline-none focus:ring-2 transition-colors ${
      hasError
        ? 'border-red-400 dark:border-red-700 focus:ring-red-500'
        : 'border-neutral-200 dark:border-metallic/20 focus:ring-neon-orange/60 focus:border-neon-orange/60'
    }`;

  const labelClass = 'block text-sm font-medium text-neutral-darker dark:text-white mb-1.5';

  const hintClass = 'mt-1 text-xs text-neutral-medium dark:text-metallic';

  const errorText = (msg?: string) =>
    msg ? (
      <motion.p
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-1 text-sm text-red-500 dark:text-red-400"
      >
        {msg}
      </motion.p>
    ) : null;

  const sectionLabel = (text: string) => (
    <div className="flex items-center gap-3 mb-6">
      <span className="text-xs font-mono text-neon-orange tracking-widest uppercase">
        {text}
      </span>
      <div className="flex-grow h-px bg-gradient-to-r from-neon-orange/40 to-transparent" />
    </div>
  );

  type RadioOpt = { value: string; label: string };
  const radioGroup = (
    field: keyof FormState,
    options: RadioOpt[],
    error?: string,
  ) => (
    <div className="grid grid-cols-1 gap-2">
      {options.map((opt) => {
        const checked = form[field] === opt.value;
        return (
          <label
            key={opt.value}
            className={`group flex items-start gap-3 cursor-pointer px-4 py-3 rounded-lg border transition-all ${
              checked
                ? 'border-neon-orange bg-neon-orange/5 text-neutral-darker dark:text-white'
                : `border-neutral-200 dark:border-metallic/20 hover:border-neon-orange/40 ${
                    error ? 'border-red-300 dark:border-red-800' : ''
                  } text-neutral-dark dark:text-metallic`
            }`}
          >
            <input
              type="radio"
              name={field}
              value={opt.value}
              checked={checked}
              onChange={(e) => update(field, e.target.value)}
              onBlur={() => blur(field)}
              className="sr-only"
            />
            <span
              className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded-full border-2 transition-colors ${
                checked
                  ? 'border-neon-orange bg-neon-orange/30'
                  : 'border-neutral-300 dark:border-metallic/40 group-hover:border-neon-orange/50'
              }`}
              aria-hidden
            >
              {checked && (
                <span className="block w-1.5 h-1.5 mx-auto mt-[3px] rounded-full bg-neon-orange" />
              )}
            </span>
            <span className="text-sm leading-snug">{opt.label}</span>
          </label>
        );
      })}
    </div>
  );

  return (
    <div className="w-full">
      {submitStatus === 'success' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-lg border border-acid-green/40 bg-acid-green/5 text-acid-green-dark dark:text-acid-green font-medium"
          role="status"
        >
          ✓ {t.success}
        </motion.div>
      )}
      {submitStatus === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-lg border border-red-400/40 bg-red-500/5 text-red-600 dark:text-red-400"
          role="alert"
        >
          ✕ {t.error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-10" noValidate>
        {/* ── Contact section ────────────────────────────────────── */}
        <div>
          {sectionLabel(t.sections.contact)}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="pi-name" className={labelClass}>
                {t.labels.name} <span className="text-neon-orange">*</span>
              </label>
              <input
                id="pi-name"
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                onBlur={() => blur('name')}
                placeholder={t.placeholders.name}
                className={inputClass(touched.name ? errors.name : undefined)}
                aria-invalid={!!errors.name}
              />
              {touched.name && errorText(errors.name)}
            </div>
            <div>
              <label htmlFor="pi-email" className={labelClass}>
                {t.labels.email} <span className="text-neon-orange">*</span>
              </label>
              <input
                id="pi-email"
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                onBlur={() => blur('email')}
                placeholder={t.placeholders.email}
                className={inputClass(touched.email ? errors.email : undefined)}
                aria-invalid={!!errors.email}
              />
              {touched.email && errorText(errors.email)}
            </div>
            <div>
              <label htmlFor="pi-company" className={labelClass}>
                {t.labels.company}
              </label>
              <input
                id="pi-company"
                type="text"
                value={form.company}
                onChange={(e) => update('company', e.target.value)}
                placeholder={t.placeholders.company}
                className={inputClass()}
              />
            </div>
            <div>
              <label htmlFor="pi-backup" className={labelClass}>
                {t.labels.backupContact}
              </label>
              <input
                id="pi-backup"
                type="text"
                value={form.backupContact}
                onChange={(e) => update('backupContact', e.target.value)}
                placeholder={t.placeholders.backupContact}
                className={inputClass()}
              />
              <p className={hintClass}>{t.labels.backupContactHint}</p>
            </div>
          </div>
        </div>

        {/* ── Project section ────────────────────────────────────── */}
        <div>
          {sectionLabel(t.sections.project)}

          {/* Service type */}
          <div className="mb-7">
            <label className={labelClass}>
              {t.labels.serviceType} <span className="text-neon-orange">*</span>
            </label>
            {radioGroup('serviceType', t.options.serviceTypes, touched.serviceType ? errors.serviceType : undefined)}
            {touched.serviceType && errorText(errors.serviceType)}
          </div>

          {/* Budget + Timeline side-by-side on md+ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7 mb-7">
            <div>
              <label className={labelClass}>
                {t.labels.budget} <span className="text-neon-orange">*</span>
              </label>
              {radioGroup('budget', t.options.budgets, touched.budget ? errors.budget : undefined)}
              {touched.budget && errorText(errors.budget)}
            </div>
            <div>
              <label className={labelClass}>
                {t.labels.timeline} <span className="text-neon-orange">*</span>
              </label>
              {radioGroup('timeline', t.options.timelines, touched.timeline ? errors.timeline : undefined)}
              {touched.timeline && errorText(errors.timeline)}
            </div>
          </div>

          {/* Description */}
          <div className="mb-7">
            <label htmlFor="pi-description" className={labelClass}>
              {t.labels.description} <span className="text-neon-orange">*</span>
            </label>
            <textarea
              id="pi-description"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              onBlur={() => blur('description')}
              placeholder={t.placeholders.description}
              rows={6}
              className={`${inputClass(touched.description ? errors.description : undefined)} resize-none`}
              aria-invalid={!!errors.description}
            />
            <div className="flex items-start justify-between mt-1">
              <p className={hintClass}>{t.labels.descriptionHint}</p>
              <span className={`${hintClass} flex-shrink-0 ml-3 font-mono`}>
                {form.description.length}/30+
              </span>
            </div>
            {touched.description && errorText(errors.description)}
          </div>

          {/* Referral */}
          <div>
            <label className={labelClass}>{t.labels.referral}</label>
            {radioGroup('referral', t.options.referrals)}
            <p className={hintClass}>{t.labels.referralHint}</p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="min-w-[220px]"
          >
            {isSubmitting ? t.submitting : t.submit}
          </Button>
          <p className="text-xs text-neutral-medium dark:text-metallic text-center max-w-md">
            {t.footnote}
          </p>
        </div>
      </form>
    </div>
  );
};

export default ProjectInquiryForm;
