export type Periodicity = 'mensuel' | 'trimestriel' | 'annuel';

/** Soft/lightened color palette used in the summary table (blocks). */
export const CHART_LIGHTEN_AMOUNT = 0.55;

/** Neutral palette used for "Subscriptions vs Charges" charts. */
export const SUBSCRIPTION_COLOR = '#475569'; // slate-600 (dark)
export const CHARGE_COLOR = '#94a3b8'; // slate-400 (light)

export function monthlyLissedCents(entry: {
	amountCents: number;
	periodicity: Periodicity;
}): number {
	if (entry.periodicity === 'mensuel') return entry.amountCents;
	if (entry.periodicity === 'trimestriel') return entry.amountCents / 3;
	return entry.amountCents / 12;
}

/**
 * Returns '#ffffff' or '#0f172a' depending on which gives the best contrast against the given hex color.
 * Uses the YIQ formula.
 */
export function contrastText(hex: string | null | undefined): string {
	if (!hex) return '#0f172a';
	const clean = hex.replace('#', '');
	if (clean.length !== 6) return '#0f172a';
	const rgb = parseInt(clean, 16);
	if (!Number.isFinite(rgb)) return '#0f172a';
	const r = (rgb >> 16) & 0xff;
	const g = (rgb >> 8) & 0xff;
	const b = rgb & 0xff;
	const yiq = (r * 299 + g * 587 + b * 114) / 1000;
	return yiq >= 160 ? '#0f172a' : '#ffffff';
}

/**
 * Blends a hex color with white by the given amount (0 = original, 1 = pure white).
 * Used to produce a lighter variant of an account color for alternating columns.
 */
export function lighten(hex: string | null | undefined, amount: number): string {
	if (!hex) return '#ffffff';
	const clean = hex.replace('#', '');
	if (clean.length !== 6) return hex;
	const rgb = parseInt(clean, 16);
	if (!Number.isFinite(rgb)) return hex;
	const r = (rgb >> 16) & 0xff;
	const g = (rgb >> 8) & 0xff;
	const b = rgb & 0xff;
	const nr = Math.round(r + (255 - r) * amount);
	const ng = Math.round(g + (255 - g) * amount);
	const nb = Math.round(b + (255 - b) * amount);
	const to2 = (n: number) => n.toString(16).padStart(2, '0');
	return `#${to2(nr)}${to2(ng)}${to2(nb)}`;
}
