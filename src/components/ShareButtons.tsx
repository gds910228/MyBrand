"use client";

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faLinkedin, faFacebook } from '@fortawesome/free-brands-svg-icons';
import { faLink, faCheck } from '@fortawesome/free-solid-svg-icons';

export interface ShareButtonsProps {
  /**
   * 分享的标题
   */
  title: string;
  /**
   * 分享的 URL
   */
  url: string;
  /**
   * 分享描述（可选）
   */
  description?: string;
  /**
   * 语言区域设置
   */
  locale?: 'en' | 'zh';
  /**
   * 是否显示标签
   */
  showLabels?: boolean;
}

const ShareButtons: React.FC<ShareButtonsProps> = ({
  title,
  url,
  description,
  locale = 'en',
  showLabels = false,
}) => {
  const [copied, setCopied] = useState(false);

  // 分享平台配置
  const platforms = {
    twitter: {
      icon: faTwitter,
      color: 'hover:bg-[#1DA1F2]',
      bgColor: 'bg-[#1DA1F2]',
      getShareUrl: () => {
        const text = description ? `${title}\n${description}` : title;
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      },
    },
    facebook: {
      icon: faFacebook,
      color: 'hover:bg-[#4267B2]',
      bgColor: 'bg-[#4267B2]',
      getShareUrl: () => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    linkedin: {
      icon: faLinkedin,
      color: 'hover:bg-[#0077B5]',
      bgColor: 'bg-[#0077B5]',
      getShareUrl: () => {
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
      },
    },
  };

  // 复制链接到剪贴板
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // 打开分享窗口
  const handleShare = (shareUrl: string) => {
    window.open(shareUrl, '_blank', 'width=550,height=420,noopener,noreferrer');
  };

  const i18n = {
    en: {
      share: 'Share',
      copyLink: 'Copy Link',
      copied: 'Copied!',
    },
    zh: {
      share: '分享',
      copyLink: '复制链接',
      copied: '已复制！',
    },
  }[locale];

  const text = i18n;

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {/* Twitter */}
      <button
        onClick={() => handleShare(platforms.twitter.getShareUrl())}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-white transition-all duration-200 hover:scale-105 shadow-md ${platforms.twitter.color} ${platforms.twitter.bgColor}`}
        aria-label="Share on Twitter"
        title="Share on Twitter"
      >
        <FontAwesomeIcon icon={platforms.twitter.icon} className="w-4 h-4" />
        {showLabels && <span>Twitter</span>}
      </button>

      {/* Facebook */}
      <button
        onClick={() => handleShare(platforms.facebook.getShareUrl())}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-white transition-all duration-200 hover:scale-105 shadow-md ${platforms.facebook.color} ${platforms.facebook.bgColor}`}
        aria-label="Share on Facebook"
        title="Share on Facebook"
      >
        <FontAwesomeIcon icon={platforms.facebook.icon} className="w-4 h-4" />
        {showLabels && <span>Facebook</span>}
      </button>

      {/* LinkedIn */}
      <button
        onClick={() => handleShare(platforms.linkedin.getShareUrl())}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-white transition-all duration-200 hover:scale-105 shadow-md ${platforms.linkedin.color} ${platforms.linkedin.bgColor}`}
        aria-label="Share on LinkedIn"
        title="Share on LinkedIn"
      >
        <FontAwesomeIcon icon={platforms.linkedin.icon} className="w-4 h-4" />
        {showLabels && <span>LinkedIn</span>}
      </button>

      {/* Copy Link */}
      <button
        onClick={handleCopyLink}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium glass-surface border border-white/20 dark:border-white/10 hover:scale-105 transition-all duration-200 ${
          copied ? 'bg-green-500/20 text-green-600 border-green-500/50' : ''
        }`}
        aria-label={text.copyLink}
        title={copied ? text.copied : text.copyLink}
      >
        {copied ? (
          <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
        ) : (
          <FontAwesomeIcon icon={faLink} className="w-4 h-4" />
        )}
        {showLabels && <span>{copied ? text.copied : text.copyLink}</span>}
      </button>
    </div>
  );
};

export default ShareButtons;
