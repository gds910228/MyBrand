import type { Metadata } from 'next';
import DisclaimerContent from './DisclaimerContent';

export const metadata: Metadata = {
  title: 'Disclaimer | MisoTech',
  description:
    'Understand the limitations of MisoTech content, third-party links, and advertising relationships to make informed decisions.',
};

export default function DisclaimerPage() {
  return <DisclaimerContent />;
}
