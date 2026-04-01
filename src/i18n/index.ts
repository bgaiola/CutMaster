import { useAppStore } from '@/stores/appStore';
import { Locale } from '@/types';
import es, { Translations } from './es';
import ptBR from './pt-br';
import en from './en';
import fr from './fr';
import it from './it';

const translations: Record<Locale, Translations> = {
  es,
  'pt-BR': ptBR,
  en,
  fr,
  it,
};

export const localeLabels: Record<Locale, string> = {
  es: 'Español',
  'pt-BR': 'Português (BR)',
  en: 'English',
  fr: 'Français',
  it: 'Italiano',
};

export function useTranslation() {
  const locale = useAppStore((s) => s.locale);
  const t = translations[locale] || translations.es;
  return { t, locale };
}

export { translations };
export type { Translations };
