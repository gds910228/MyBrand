"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';

interface NotionRendererProps {
  blocks: any[];
  className?: string;
}

const NotionRenderer: React.FC<NotionRendererProps> = ({ blocks, className = '' }) => {
  if (!blocks || blocks.length === 0) {
    return null;
  }

  // 为所有标题生成唯一 ID
  let headingCounter = 0;
  const blocksWithIds = blocks.map((block) => {
    if (
      block.type === 'heading_1' ||
      block.type === 'heading_2' ||
      block.type === 'heading_3'
    ) {
      return {
        ...block,
        headingId: `heading-${headingCounter++}`,
      };
    }
    return block;
  });

  return (
    <div className={`notion-content ${className}`}>
      {blocksWithIds.map((block, index) => (
        <BlockRenderer key={block.id || index} block={block} />
      ))}
    </div>
  );
};

const BlockRenderer: React.FC<{ block: any }> = ({ block }) => {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const handleCopyCode = async (code: string, blockId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeId(blockId);
      setTimeout(() => setCopiedCodeId(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  switch (block.type) {
    case 'paragraph':
      return <p className="mb-4 text-neutral-dark dark:text-dark-neutral-dark">{renderRichText(block.paragraph.rich_text)}</p>;

    case 'heading_1':
      return (
        <h1
          id={block.headingId}
          className="text-3xl font-bold mb-4 text-neutral-darker dark:text-dark-neutral-darker scroll-mt-24"
        >
          {renderRichText(block.heading_1.rich_text)}
        </h1>
      );

    case 'heading_2':
      return (
        <h2
          id={block.headingId}
          className="text-2xl font-semibold mb-3 text-neutral-darker dark:text-dark-neutral-darker scroll-mt-24"
        >
          {renderRichText(block.heading_2.rich_text)}
        </h2>
      );

    case 'heading_3':
      return (
        <h3
          id={block.headingId}
          className="text-xl font-semibold mb-2 text-neutral-darker dark:text-dark-neutral-darker scroll-mt-24"
        >
          {renderRichText(block.heading_3.rich_text)}
        </h3>
      );

    case 'bulleted_list_item':
      return (
        <ul className="list-disc list-inside mb-4 ml-4">
          <li className="mb-2 text-neutral-dark dark:text-dark-neutral-dark">{renderRichText(block.bulleted_list_item.rich_text)}</li>
        </ul>
      );

    case 'numbered_list_item':
      return (
        <ol className="list-decimal list-inside mb-4 ml-4">
          <li className="mb-2 text-neutral-dark dark:text-dark-neutral-dark">{renderRichText(block.numbered_list_item.rich_text)}</li>
        </ol>
      );

    case 'code':
      const codeText = renderRichText(block.code.rich_text, true) as string;
      const language = block.code.language || 'code';
      const isCopied = copiedCodeId === block.id;

      return (
        <div className="mb-4 relative group">
          <div className="flex items-center justify-between bg-neutral-200 dark:bg-dark-neutral-dark px-4 py-2 rounded-t-lg text-xs text-neutral-dark dark:text-dark-neutral-dark">
            <span className="font-mono uppercase">{language}</span>
            <button
              onClick={() => handleCopyCode(codeText, block.id)}
              className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-neutral-300 dark:hover:bg-dark-neutral-light transition-colors"
              title="Copy code"
            >
              {isCopied ? (
                <>
                  <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-green-500">Copied!</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCopy} className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <pre className="bg-neutral-light dark:bg-dark-neutral-light p-4 rounded-b-lg overflow-x-auto">
            <code className={`language-${language} text-sm`}>{codeText}</code>
          </pre>
        </div>
      );

    case 'quote':
      return (
        <blockquote className="border-l-4 border-primary pl-4 mb-4 italic text-neutral-medium dark:text-dark-neutral-medium">{renderRichText(block.quote.rich_text)}</blockquote>
      );

    case 'image':
      const imageUrl = block.image.type === 'external' ? block.image.external.url : block.image.file.url;
      const captionRich = Array.isArray(block.image.caption) ? block.image.caption : [];
      const captionText = captionRich.map((t: any) => t.plain_text).join('');
      const captionNodes = captionRich.length ? renderRichText(captionRich) : null;
      return (
        <figure className="my-6">
          <div className="relative overflow-hidden rounded-lg">
            <Image
              src={imageUrl}
              alt={captionText || 'Image'}
              width={800}
              height={450}
              className="w-full h-auto rounded-lg transition-transform duration-300 hover:scale-105"
              placeholder="empty"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
            />
          </div>
          {captionNodes && <figcaption className="text-center text-sm text-neutral-medium dark:text-dark-neutral-medium mt-2">{captionNodes}</figcaption>}
        </figure>
      );

    case 'video':
      const videoUrl = block.video.type === 'external' ? block.video.external.url : block.video.file.url;
      const videoCaptionRich = Array.isArray(block.video.caption) ? block.video.caption : [];
      const videoCaptionText = videoCaptionRich.map((t: any) => t.plain_text).join('');
      const videoCaptionNodes = videoCaptionRich.length ? renderRichText(videoCaptionRich) : null;
      
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        const embedUrl = convertToEmbedUrl(videoUrl);
        return (
          <figure className="my-6">
            <div className="relative overflow-hidden rounded-lg" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={embedUrl}
                title={videoCaptionText || 'Video'}
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {videoCaptionNodes && <figcaption className="text-center text-sm text-neutral-medium dark:text-dark-neutral-medium mt-2">{videoCaptionNodes}</figcaption>}
          </figure>
        );
      } else {
        return (
          <figure className="my-6">
            <div className="relative overflow-hidden rounded-lg" style={{ paddingBottom: '56.25%' }}>
              <video
                controls
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                src={videoUrl}
              >
                Your browser does not support the video tag.
              </video>
            </div>
            {videoCaptionNodes && <figcaption className="text-center text-sm text-neutral-medium dark:text-dark-neutral-medium mt-2">{videoCaptionNodes}</figcaption>}
          </figure>
        );
      }

    case 'embed':
      const embedUrl = block.embed.url;
      return (
        <div className="my-6">
          <div className="relative overflow-hidden rounded-lg" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={embedUrl}
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              frameBorder="0"
              allowFullScreen
            />
          </div>
        </div>
      );

    case 'divider':
      return <hr className="my-8 border-neutral-light dark:border-dark-neutral-light" />;

    case 'callout':
      const calloutIcon = block.callout.icon?.emoji || '💡';
      return (
        <div className="my-6 p-4 bg-primary/10 border-l-4 border-primary rounded-r-lg">
          <div className="flex items-start">
            <span className="text-xl mr-3">{calloutIcon}</span>
            <div className="text-neutral-dark dark:text-dark-neutral-dark">{renderRichText(block.callout.rich_text)}</div>
          </div>
        </div>
      );

    default:
      return null;
  }
};

const renderRichText = (richText: any[], returnPlainText = false) => {
  if (!richText || richText.length === 0) {
    return '';
  }

  // 如果需要纯文本（用于复制代码）
  if (returnPlainText) {
    return richText.map((text: any) => text.plain_text).join('');
  }

  return richText.map((text: any, index: number) => {
    let content = text.plain_text;

    if (text.annotations.bold) {
      content = <strong key={index}>{content}</strong>;
    }

    if (text.annotations.italic) {
      content = <em key={index}>{content}</em>;
    }

    if (text.annotations.strikethrough) {
      content = <del key={index}>{content}</del>;
    }

    if (text.annotations.underline) {
      content = <u key={index}>{content}</u>;
    }

    if (text.annotations.code) {
      content = <code key={index} className="bg-neutral-light dark:bg-dark-neutral-light px-1 py-0.5 rounded text-sm">{content}</code>;
    }

    if (text.href) {
      content = <a key={index} href={text.href} target="_blank" rel="noopener noreferrer" className="text-primary dark:text-dark-primary hover:underline">{content}</a>;
    }
    
    return content;
  });
};

const convertToEmbedUrl = (url: string) => {
  const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(youtubeRegex);
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return url;
};

export default NotionRenderer;