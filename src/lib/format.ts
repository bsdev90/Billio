export const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY'] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

const DEFAULT_CURRENCY: Currency = 'EUR';

const CURRENCY_LOCALE: Record<Currency, string> = {
	EUR: 'fr-FR',
	USD: 'en-US',
	GBP: 'en-GB',
	CHF: 'de-CH',
	CAD: 'en-CA',
	AUD: 'en-AU',
	JPY: 'en-US'
};

let currentCurrency: Currency = DEFAULT_CURRENCY;

export function setCurrency(code: string) {
	if (isSupportedCurrency(code)) {
		currentCurrency = code;
	}
}

export function getCurrency(): Currency {
	return currentCurrency;
}

export function isSupportedCurrency(code: string): code is Currency {
	return (SUPPORTED_CURRENCIES as readonly string[]).includes(code);
}

export function formatCurrency(amount: number, currency: Currency = currentCurrency): string {
	return new Intl.NumberFormat(CURRENCY_LOCALE[currency], {
		style: 'currency',
		currency
	}).format(amount);
}

export function formatCents(cents: number, currency: Currency = currentCurrency): string {
	return formatCurrency(cents / 100, currency);
}

export function parseAmountToCents(input: string): number | null {
	if (typeof input !== 'string') return null;
	const normalized = input.trim().replace(/\s/g, '').replace(',', '.');
	if (!normalized) return null;
	const value = Number(normalized);
	if (!Number.isFinite(value) || value < 0) return null;
	return Math.round(value * 100);
}
