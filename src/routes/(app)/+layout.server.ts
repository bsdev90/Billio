import type { LayoutServerLoad } from './$types';
import { getSetting } from '$lib/server/settings-service';
import { isSupportedCurrency, type Currency } from '$lib/format';
import { locales, baseLocale } from '$lib/paraglide/runtime';

export const load: LayoutServerLoad = async ({ locals }) => {
	const [currencyRaw, localeRaw] = await Promise.all([
		getSetting('app.currency'),
		getSetting('app.locale')
	]);
	const currency: Currency =
		currencyRaw && isSupportedCurrency(currencyRaw) ? currencyRaw : 'EUR';
	const locale =
		localeRaw && (locales as readonly string[]).includes(localeRaw) ? localeRaw : baseLocale;
	return {
		user: locals.user,
		currency,
		locale
	};
};
