"use client";

import React, { useState } from 'react';
import { Experience as ExperienceType } from '@/data/experience';

interface TimelineItemProps {
  experience: ExperienceType;
  locale?: 'en' | 'zh';
  index?: number;
}

const TimelineItem: React.FC<TimelineItemProps> = ({
  experience,
  locale = 'en',
  index = 0
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const {
    year,
    yearZh,
    title,
    titleZh,
    company,
    companyZh,
    description,
    descriptionZh,
    achievements,
    techStack,
    isCurrent,
    companyUrl,
    companyInfo
  } = experience;

  const displayYear = locale === 'en' ? year : yearZh;
  const displayTitle = locale === 'en' ? title : titleZh;
  const displayCompany = locale === 'en' ? company : companyZh;
  const displayDescription = locale === 'en' ? description : descriptionZh;

  return (
    <div className="relative">
      {/* Timeline Dot */}
      <div className="absolute left-0 md:left-auto md:right-0 top-6 w-4 h-4 rounded-full bg-primary dark:bg-dark-primary border-4 border-white dark:border-dark-bg-primary shadow-lg z-10 transform md:translate-x-1/2"></div>

      {/* Content Card */}
      <div className="ml-8 md:ml-0 md:mr-8 md:pr-12">
        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-md hover:shadow-lg dark:hover:shadow-neutral-black/30 transition-all duration-300 overflow-hidden border border-neutral-light/30 dark:border-dark-neutral-light/30">
          {/* Header */}
          <div
            className="p-6 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {/* Year Badge & Current Badge */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-primary-dark dark:text-dark-primary-dark bg-primary-light/20 dark:bg-dark-primary-light/20 rounded-full">
                {displayYear}
              </span>
              {isCurrent && (
                <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-dark dark:text-dark-green-dark bg-green-light/30 dark:bg-dark-green-light/30 rounded-full">
                  <span className="w-2 h-2 bg-green dark:bg-dark-green rounded-full mr-2 animate-pulse"></span>
                  {locale === 'en' ? 'Current' : '当前'}
                </span>
              )}
            </div>

            {/* Title & Company */}
            <h3 className="text-xl font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-1">
              {displayTitle}
            </h3>

            {/* Company with or without link/info tooltip */}
            {companyUrl ? (
              <a
                href={companyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary dark:text-dark-primary font-medium hover:underline inline-flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                {displayCompany}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ) : companyInfo ? (
              <div className="relative inline-block">
                <span
                  className="text-primary dark:text-dark-primary font-medium inline-flex items-center gap-1 cursor-help border-b border-dashed border-primary/50 dark:border-dark-primary/50 hover:border-primary dark:hover:border-dark-primary"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={(e) => e.stopPropagation()}
                >
                  {displayCompany}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>

                {/* Tooltip */}
                {showTooltip && (
                  <div className="absolute z-50 w-72 p-4 mt-2 bg-white dark:bg-dark-bg-primary border-2 border-primary dark:border-dark-primary rounded-lg shadow-xl dark:shadow-neutral-black/40 text-sm">
                    {/* Industry */}
                    <div className="mb-2">
                      <span className="font-semibold text-neutral-darker dark:text-dark-neutral-darker">
                        {locale === 'en' ? 'Industry' : '行业'}:
                      </span>{' '}
                      <span className="text-neutral-dark dark:text-dark-neutral-dark">
                        {locale === 'en' ? companyInfo.industry : companyInfo.industryZh}
                      </span>
                    </div>

                    {/* Size */}
                    <div className="mb-2">
                      <span className="font-semibold text-neutral-darker dark:text-dark-neutral-darker">
                        {locale === 'en' ? 'Company Size' : '公司规模'}:
                      </span>{' '}
                      <span className="text-neutral-dark dark:text-dark-neutral-dark">
                        {locale === 'en' ? companyInfo.size : companyInfo.sizeZh}
                      </span>
                    </div>

                    {/* Location */}
                    {companyInfo.location && (
                      <div className="mb-2">
                        <span className="font-semibold text-neutral-darker dark:text-dark-neutral-darker">
                          {locale === 'en' ? 'Location' : '所在地'}:
                        </span>{' '}
                        <span className="text-neutral-dark dark:text-dark-neutral-dark">
                          {locale === 'en' ? companyInfo.location : companyInfo.locationZh}
                        </span>
                      </div>
                    )}

                    {/* Description */}
                    {companyInfo.description && (
                      <div className="pt-2 mt-2 border-t border-neutral-light dark:border-dark-neutral-light">
                        <span className="text-neutral-dark dark:text-dark-neutral-dark italic">
                          {locale === 'en' ? companyInfo.description : companyInfo.descriptionZh}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-primary dark:text-dark-primary font-medium">
                {displayCompany}
              </p>
            )}

            {/* Description */}
            <p className="mt-3 text-neutral-dark dark:text-dark-neutral-dark leading-relaxed">
              {displayDescription}
            </p>

            {/* Expand/Collapse Indicator */}
            <div className="mt-4 flex items-center justify-between">
              <button
                className="text-sm text-primary dark:text-dark-primary hover:underline focus:outline-none inline-flex items-center gap-1"
              >
                {isExpanded
                  ? (locale === 'en' ? 'Show Less' : '收起详情')
                  : (locale === 'en' ? 'View Achievements & Tech Stack' : '查看成就与技术栈')}
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Expandable Content */}
          <div
            className={`overflow-hidden transition-all duration-300 border-t border-neutral-light/30 dark:border-dark-neutral-light/30 ${
              isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="p-6 bg-neutral-light/30 dark:bg-dark-neutral-light/10">
              {/* Achievements */}
              {achievements && achievements.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-neutral-darker dark:text-dark-neutral-darker mb-3 uppercase tracking-wide">
                    {locale === 'en' ? 'Key Achievements' : '主要成就'}
                  </h4>
                  <ul className="space-y-2">
                    {achievements.map((achievement, idx) => {
                      const text = locale === 'en' ? achievement.text : achievement.textZh;
                      return (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-neutral-dark dark:text-dark-neutral-dark"
                        >
                          <span className="text-primary dark:text-dark-primary mt-0.5 flex-shrink-0">✓</span>
                          <span className="flex-1">{text}</span>
                          {achievement.metric && (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold text-primary dark:text-dark-primary bg-primary-light/20 dark:bg-dark-primary-light/20 rounded">
                              {achievement.metric}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Tech Stack */}
              {techStack && techStack.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-neutral-darker dark:text-dark-neutral-darker mb-3 uppercase tracking-wide">
                    {locale === 'en' ? 'Tech Stack' : '技术栈'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {techStack.map((tech, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1 text-sm font-medium text-neutral-darker dark:text-dark-neutral-darker bg-white dark:bg-dark-bg-primary border border-neutral-light/50 dark:border-dark-neutral-light/50 rounded-md hover:border-primary dark:hover:border-dark-primary hover:text-primary dark:hover:text-dark-primary transition-colors duration-200"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineItem;
