import type { Metadata } from 'next';
import PrivacyContent from './PrivacyContent';

export const metadata: Metadata = {
  title: 'Privacy Policy | MisoTech',
  description:
    'Learn how MisoTech collects, uses, and protects your personal information, with full transparency into data rights and third-party advertising cookies.',
};

export default function PrivacyPolicyPage() {
  return <PrivacyContent />;
}
