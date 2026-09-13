import type { Metadata } from 'next';
import { siteUrl, socialImage } from './site-metadata';

export type GuideLanguage = 'en' | 'zh-CN';
export const alternativePaths: Record<GuideLanguage, string> = {
  en: '/screen-studio-alternatives',
  'zh-CN': '/zh-cn/screen-studio-alternatives',
};

export function alternativeMetadata(language: GuideLanguage): Metadata {
  const title = language === 'en'
    ? 'Screen Studio Alternatives for Mac, Windows & Linux | Recorder Select'
    : 'Screen Studio 平替：Mac、Windows 与免费开源录屏软件对比 | Recorder Select';
  const description = language === 'en'
    ? 'Find a Screen Studio alternative by platform, open-source availability, pricing, cursor effects and export features. Compare recorder data and macOS benchmarks.'
    : '寻找 Screen Studio 平替？按 Mac、Windows、Linux、免费与开源需求比较录屏软件，查看光标效果、导出功能、价格与 macOS 性能实测，选择适合教程和产品演示的工具。';
  return {
    title, description,
    alternates: { canonical: alternativePaths[language], languages: { ...alternativePaths, 'x-default': alternativePaths.en } },
    openGraph: { type: 'article', url: alternativePaths[language], title, description, siteName: 'Recorder Select',
      locale: language === 'en' ? 'en_US' : 'zh_CN', alternateLocale: language === 'en' ? 'zh_CN' : 'en_US', images: [socialImage] },
    twitter: { card: 'summary_large_image', title, description, images: [new URL('/og.png', siteUrl).href] },
  };
}
