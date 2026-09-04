import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { I18nProvider } from '../lib/i18n';
import { siteUrl, socialImage, socialImageAlt } from '../lib/site-metadata';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: 'Recorder Select — Compare screen recorders',
  description: 'A clear, independent comparison of the best screen recording tools.',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Recorder Select',
    title: 'Recorder Select',
    description: 'Compare screen recorders clearly.',
    images: [socialImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Recorder Select',
    description: 'Compare screen recorders clearly.',
    images: [{ url: '/og.png', alt: socialImageAlt }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){}try{document.documentElement.dataset.tableFullWidth=String(localStorage.getItem('recorder-select:table-full-width:v1')==='true')}catch(e){}})()` }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
