import { Heading } from '@/components/TableOfContents';

/**
 * 从 Notion blocks 中提取标题
 * @param blocks - Notion blocks 数组
 * @returns 标题数组
 */
export function extractHeadingsFromNotion(blocks: any[]): Heading[] {
  const headings: Heading[] = [];
  let headingCounter = 0;

  blocks.forEach((block) => {
    if (
      block.type === 'heading_1' ||
      block.type === 'heading_2' ||
      block.type === 'heading_3'
    ) {
      const headingBlock = block[block.type];
      if (headingBlock && headingBlock.rich_text && headingBlock.rich_text.length > 0) {
        // 提取标题文本
        const text = headingBlock.rich_text
          .map((textObj: any) => textObj.plain_text || '')
          .join('')
          .trim();

        if (text) {
          const level = block.type === 'heading_1' ? 1 : block.type === 'heading_2' ? 2 : 3;
          const id = `heading-${headingCounter++}`;

          headings.push({
            id,
            text,
            level,
          });
        }
      }
    }
  });

  return headings;
}

/**
 * 为 NotionRenderer 的标题添加 ID 属性
 * 这个函数会在 NotionRenderer 中使用，为标题元素添加可跳转的 ID
 */
export function addHeadingIds(blocks: any[]): any[] {
  let headingCounter = 0;

  return blocks.map((block) => {
    if (
      block.type === 'heading_1' ||
      block.type === 'heading_2' ||
      block.type === 'heading_3'
    ) {
      return {
        ...block,
        id: `heading-${headingCounter++}`,
      };
    }
    return block;
  });
}
