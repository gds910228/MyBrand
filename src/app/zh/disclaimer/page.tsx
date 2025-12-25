import type { Metadata } from 'next';
import DisclaimerZhContent from './DisclaimerContent';

export const metadata: Metadata = {
  title: '免责声明 | MisoTech',
  description:
    '了解 MisoTech 内容的责任范围、外部链接与广告合作声明，帮助您做出明智判断。',
};

export default function DisclaimerZhPage() {
  return <DisclaimerZhContent />;
}
