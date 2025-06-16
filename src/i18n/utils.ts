import { getRequestConfig } from 'next-intl/server';
import { locales, Locale } from './locales';

export async function getMessages(locale: Locale) {
  return (await import(`./messages/${locale}.json`)).default;
}

export default getRequestConfig(async ({ locale }) => {
  return {
    messages: await getMessages(locale as Locale),
  };
}); 