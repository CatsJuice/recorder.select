import type { Metadata } from 'next';
import { socialImage, socialImageAlt } from '../../lib/site-metadata';

export const metadata: Metadata = {
  title: 'Add a recorder — Recorder Select',
  description: 'Prepare a screen recorder submission for Recorder Select.',
  alternates: {
    canonical: '/submit',
  },
  openGraph: {
    type: 'website',
    url: '/submit',
    siteName: 'Recorder Select',
    title: 'Add a recorder — Recorder Select',
    description: 'Prepare a screen recorder submission for Recorder Select.',
    images: [socialImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Add a recorder — Recorder Select',
    description: 'Prepare a screen recorder submission for Recorder Select.',
    images: [{ url: '/og.png', alt: socialImageAlt }],
  },
};

export default function SubmitLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
