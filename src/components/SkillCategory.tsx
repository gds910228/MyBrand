"use client";

import React from 'react';
import { SkillCategory as SkillCategoryType } from '@/data/skills';
import SkillCard from './SkillCard';

interface SkillCategoryProps {
  category: SkillCategoryType;
  locale?: 'en' | 'zh';
}

const SkillCategoryComponent: React.FC<SkillCategoryProps> = ({
  category,
  locale = 'en'
}) => {
  const name = locale === 'en' ? category.name : category.nameZh;

  return (
    <div className="mb-8 md:mb-0">
      {/* Category Header */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-3xl">{category.icon}</span>
        <h3 className="text-xl font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker">
          {name}
        </h3>
        <div className="flex-1 h-px bg-neutral-light dark:bg-dark-neutral-light"></div>
        <span className="text-sm text-neutral-medium dark:text-dark-neutral-medium px-3 py-1 bg-neutral-light/50 dark:bg-dark-neutral-light/50 rounded-full">
          {category.skills.length} {locale === 'en' ? 'skills' : '项技能'}
        </span>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 gap-3">
        {category.skills.map((skill, index) => (
          <SkillCard
            key={`${skill.name}-${index}`}
            skill={skill}
            locale={locale}
            showAnimation={true}
          />
        ))}
      </div>
    </div>
  );
};

export default SkillCategoryComponent;
