import type { Metadata } from 'next';
import PrivacyPolicyZhContent from './PrivacyContent';

export const metadata: Metadata = {
  title: '隐私政策 | MisoTech',
  description:
    '详细了解 MisoTech 如何收集、使用和保护您的个人信息，并清晰说明第三方广告 Cookies 与用户权利。',
};

export default function PrivacyPolicyZhPage() {
  return <PrivacyPolicyZhContent />;
}
