"use client";

import React, { useState, useEffect } from 'react';
import { Skill, proficiencyLevels } from '@/data/skills';

interface SkillCardProps {
  skill: Skill;
  locale?: 'en' | 'zh';
  showAnimation?: boolean;
}

const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  locale = 'en',
  showAnimation = true
}) => {
  const [animatedLevel, setAnimatedLevel] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Animate progress bar on mount
  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => {
        setAnimatedLevel(skill.level);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedLevel(skill.level);
    }
  }, [skill.level, showAnimation]);

  // Get proficiency level info
  const proficiency = proficiencyLevels[skill.category];

  // Get level description
  const getLevelText = () => {
    const level = skill.level;
    if (level >= 90) return locale === 'en' ? 'Expert' : '专家';
    if (level >= 80) return locale === 'en' ? 'Advanced' : '精通';
    if (level >= 70) return locale === 'en' ? 'Proficient' : '熟练';
    if (level >= 60) return locale === 'en' ? 'Intermediate' : '中等';
    return locale === 'en' ? 'Beginner' : '入门';
  };

  return (
    <div
      className="group bg-white dark:bg-dark-bg-secondary rounded-lg p-4 shadow-sm hover:shadow-md dark:hover:shadow-neutral-black/20 transition-all duration-300 border border-neutral-light/30 dark:border-dark-neutral-light/30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Skill Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          {skill.icon && (
            <span className="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              {skill.icon}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-neutral-darker dark:text-dark-neutral-darker text-base group-hover:text-primary dark:group-hover:text-dark-primary transition-colors duration-300 truncate">
              {skill.name}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-medium text-primary dark:text-dark-primary">
                {getLevelText()}
              </span>
              {skill.yearsOfExperience && (
                <>
                  <span className="text-neutral-medium dark:text-dark-neutral-medium">•</span>
                  <span className="text-xs text-neutral-medium dark:text-dark-neutral-medium">
                    {locale === 'en'
                      ? `${skill.yearsOfExperience} yr${skill.yearsOfExperience > 1 ? 's' : ''}`
                      : `${skill.yearsOfExperience}年经验`}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-sm font-bold text-neutral-darker dark:text-dark-neutral-darker">
            {animatedLevel}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="h-2 bg-neutral-light dark:bg-dark-neutral-light rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${
              isHovered
                ? 'bg-primary dark:bg-dark-primary shadow-lg shadow-primary/30 dark:shadow-dark-primary/30'
                : 'bg-primary dark:bg-dark-primary'
            }`}
            style={{ width: `${animatedLevel}%` }}
          >
            <div className="h-full w-full animate-pulse opacity-20 bg-white"></div>
          </div>
        </div>
      </div>

      {/* Description Section - Expandable */}
      {(skill.description || isHovered) && (
        <div
          className={`overflow-hidden transition-all duration-300 ${
            isExpanded || isHovered ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          {skill.description && (
            <p className="text-sm text-neutral-dark dark:text-dark-neutral-dark leading-relaxed">
              {skill.description}
            </p>
          )}
        </div>
      )}

      {/* Expand Button (for mobile) */}
      {skill.description && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="md:hidden mt-2 text-xs text-primary dark:text-dark-primary hover:underline focus:outline-none"
        >
          {isExpanded
            ? (locale === 'en' ? 'Show Less' : '收起')
            : (locale === 'en' ? 'Show More' : '展开')}
        </button>
      )}
    </div>
  );
};

export default SkillCard;
