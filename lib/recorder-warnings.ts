import type { Locale } from './i18n';

export const hasRecorderWarning = (recorderId: string) => recorderId === 'bettershot';

const attributionWarning: Record<Locale, string> = {
  'zh-CN': '疑似基于 screendrop 创建，未标注来源',
  'zh-TW': '疑似基於 screendrop 建立，未標註來源',
  en: 'Suspected to be based on screendrop without attribution.',
  ja: 'screendrop を基に作成され、出典が明記されていない疑いがあります。',
  ko: '출처 표시 없이 screendrop을 기반으로 제작된 것으로 의심됩니다.',
  es: 'Se sospecha que está basado en screendrop sin atribución.',
  fr: 'Suspecté d’être basé sur screendrop sans attribution.',
  de: 'Verdacht auf Entwicklung auf Basis von screendrop ohne Quellenangabe.',
  'pt-BR': 'Suspeita de ter sido criado com base no screendrop sem atribuição.',
};

export const recorderWarningFor = (locale: Locale, recorderId: string) =>
  hasRecorderWarning(recorderId) ? attributionWarning[locale] : '';
