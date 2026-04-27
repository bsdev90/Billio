import { db } from './db';
import { accounts, entries } from './db/schema';
import type { Account } from './db/schema';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { monthlyLissedCents } from '$lib/budget-utils';

type PeriodCounts = { monthly: number; quarterly: number; yearly: number };

export type SummaryRow = {
	accountId: number | null;
	accountName: string;
	accountColor: string | null;
	counts: { abonnement: number; charge: number };
	countsByPeriodicity: PeriodCounts;
	countsByPeriodicityByType: {
		abonnement: PeriodCounts;
		charge: PeriodCounts;
	};
	rawCents: { monthly: number; quarterly: number; yearly: number };
	totalsCents: { monthly: number; yearly: number };
	/** Monthly smoothed amount per type (used for bars chart and donut chart) */
	lissedByType: { abonnement: number; charge: number };
};

export type Summary = {
	rows: SummaryRow[];
	total: SummaryRow;
};

function emptyRow(
	accountId: number | null,
	accountName: string,
	accountColor: string | null
): SummaryRow {
	return {
		accountId,
		accountName,
		accountColor,
		counts: { abonnement: 0, charge: 0 },
		countsByPeriodicity: { monthly: 0, quarterly: 0, yearly: 0 },
		countsByPeriodicityByType: {
			abonnement: { monthly: 0, quarterly: 0, yearly: 0 },
			charge: { monthly: 0, quarterly: 0, yearly: 0 }
		},
		rawCents: { monthly: 0, quarterly: 0, yearly: 0 },
		totalsCents: { monthly: 0, yearly: 0 },
		lissedByType: { abonnement: 0, charge: 0 }
	};
}

function finaliseTotals(row: SummaryRow): SummaryRow {
	const { monthly, quarterly, yearly } = row.rawCents;
	const yearlyTotal = monthly * 12 + quarterly * 4 + yearly;
	row.totalsCents = {
		yearly: yearlyTotal,
		monthly: yearlyTotal / 12
	};
	return row;
}

export async function computeSummary(opts: { accountIds?: number[] } = {}): Promise<Summary> {
	const accountList = await db
		.select()
		.from(accounts)
		.orderBy(asc(accounts.position), asc(accounts.id));

	const filteredAccounts =
		opts.accountIds !== undefined
			? accountList.filter((a) => opts.accountIds!.includes(a.id))
			: accountList;

	const activeEntries =
		opts.accountIds !== undefined && opts.accountIds.length === 0
			? []
			: await db
					.select()
					.from(entries)
					.where(
						opts.accountIds !== undefined
							? and(eq(entries.isActive, true), inArray(entries.accountId, opts.accountIds))
							: eq(entries.isActive, true)
					);

	const byAccount = new Map<number, SummaryRow>();
	for (const account of filteredAccounts) {
		byAccount.set(account.id, emptyRow(account.id, account.name, account.color));
	}

	for (const entry of activeEntries) {
		const row = byAccount.get(entry.accountId);
		if (!row) continue;

		if (entry.type === 'abonnement') row.counts.abonnement += 1;
		else row.counts.charge += 1;

		const periodicityKey =
			entry.periodicity === 'mensuel'
				? 'monthly'
				: entry.periodicity === 'trimestriel'
					? 'quarterly'
					: 'yearly';
		row.rawCents[periodicityKey] += entry.amountCents;
		row.countsByPeriodicity[periodicityKey] += 1;
		row.countsByPeriodicityByType[entry.type][periodicityKey] += 1;

		const lissed = monthlyLissedCents(entry);
		if (entry.type === 'abonnement') row.lissedByType.abonnement += lissed;
		else row.lissedByType.charge += lissed;
	}

	const rows = Array.from(byAccount.values()).map(finaliseTotals);

	const total = emptyRow(null, 'Total', null);
	for (const row of rows) {
		total.counts.abonnement += row.counts.abonnement;
		total.counts.charge += row.counts.charge;
		for (const k of ['monthly', 'quarterly', 'yearly'] as const) {
			total.countsByPeriodicity[k] += row.countsByPeriodicity[k];
			total.countsByPeriodicityByType.abonnement[k] += row.countsByPeriodicityByType.abonnement[k];
			total.countsByPeriodicityByType.charge[k] += row.countsByPeriodicityByType.charge[k];
			total.rawCents[k] += row.rawCents[k];
		}
		total.lissedByType.abonnement += row.lissedByType.abonnement;
		total.lissedByType.charge += row.lissedByType.charge;
	}
	finaliseTotals(total);

	return { rows, total };
}

export function centsToEuros(cents: number): number {
	return cents / 100;
}

export type AccountOption = Pick<Account, 'id' | 'name' | 'color'>;
