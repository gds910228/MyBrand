"use client";

import React, { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';

export interface ProjectFiltersProps {
  onFilterChange: (filters: {
    category: string;
    search: string;
    year: string;
  }) => void;
  locale?: string;
  technologies: string[];
  years: string[];
}

const ProjectFilters: React.FC<ProjectFiltersProps> = ({
  onFilterChange,
  locale = 'en',
  technologies,
  years,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const categories = [
    { id: 'all', name: locale === 'zh' ? '全部' : 'All', icon: '📁' },
    { id: 'web', name: 'Web', icon: '💻' },
    { id: 'mobile', name: 'Mobile', icon: '📱' },
    { id: 'design', name: 'Design', icon: '🎨' },
  ];

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    onFilterChange({ category, search: searchQuery, year: selectedYear });
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    onFilterChange({ category: selectedCategory, search: query, year: selectedYear });
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    onFilterChange({ category: selectedCategory, search: searchQuery, year });
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setSelectedYear('all');
    onFilterChange({ category: 'all', search: '', year: 'all' });
  };

  const hasActiveFilters = selectedCategory !== 'all' || searchQuery !== '' || selectedYear !== 'all';

  return (
    <div className="mb-8 space-y-4">
      {/* 搜索栏 */}
      <div className="relative">
        <FontAwesomeIcon
          icon={faSearch}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-medium dark:text-dark-neutral-medium w-4 h-4"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={locale === 'zh' ? '搜索项目...' : 'Search projects...'}
          className="w-full pl-12 pr-4 py-3 rounded-lg border border-neutral-light dark:border-dark-neutral-light bg-white dark:bg-dark-bg-secondary text-neutral-darker dark:text-dark-neutral-darker focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary focus:border-transparent transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-medium hover:text-neutral-darker dark:hover:text-dark-neutral-darker transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 筛选按钮组 */}
      <div className="flex flex-wrap items-center gap-3">
        {/* 类别筛选 */}
        <div className="flex items-center gap-2 flex-wrap">
          <FontAwesomeIcon icon={faFilter} className="text-neutral-medium dark:text-dark-neutral-medium w-4 h-4" />
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                selectedCategory === category.id
                  ? 'bg-primary dark:bg-dark-primary text-white shadow-md'
                  : 'bg-neutral-light dark:bg-dark-neutral-light text-neutral-dark dark:text-dark-neutral-dark hover:bg-neutral-300 dark:hover:bg-dark-neutral-dark'
              }`}
            >
              <span>{category.icon}</span>
              <span className="text-sm">{category.name}</span>
            </button>
          ))}
        </div>

        {/* 年份筛选 */}
        {years.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
              className="px-4 py-2 rounded-lg border border-neutral-light dark:border-dark-neutral-light bg-white dark:bg-dark-bg-secondary text-neutral-dark dark:text-dark-neutral-dark text-sm font-medium focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary cursor-pointer"
            >
              <option value="all">{locale === 'zh' ? '所有年份' : 'All Years'}</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 清除筛选 */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-dark dark:text-dark-red-dark hover:bg-red-light/20 dark:hover:bg-dark-red-light/20 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
            {locale === 'zh' ? '清除' : 'Clear'}
          </button>
        )}
      </div>

      {/* 活跃筛选标签 */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2">
          {selectedCategory !== 'all' && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 dark:bg-dark-primary/10 text-primary dark:text-dark-primary text-xs font-medium">
              {locale === 'zh' ? '类别: ' : 'Category: '}
              {categories.find((c) => c.id === selectedCategory)?.name}
            </span>
          )}
          {selectedYear !== 'all' && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 dark:bg-dark-primary/10 text-primary dark:text-dark-primary text-xs font-medium">
              {locale === 'zh' ? '年份: ' : 'Year: '}
              {selectedYear}
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 dark:bg-dark-primary/10 text-primary dark:text-dark-primary text-xs font-medium">
              {locale === 'zh' ? '搜索: ' : 'Search: '}
              "{searchQuery}"
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectFilters;
