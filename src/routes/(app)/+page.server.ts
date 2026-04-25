import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { computeSummary } from '$lib/server/budget';
import {
	deleteEntry,
	listAccountsForSelect,
	listEntries,
	type EntryFilter
} from '$lib/server/entries-service';

function parseFilters(url: URL): EntryFilter {
	const filter: EntryFilter = {};
	const accountsParam = url.searchParams.get('accounts');
	if (accountsParam) {
		const ids = accountsParam
			.split(',')
			.map((v) => Number(v.trim()))
			.filter((n) => Number.isFinite(n) && n > 0);
		if (ids.length > 0) filter.accountIds = ids;
	}
	const type = url.searchParams.get('type');
	if (type === 'abonnement' || type === 'charge') filter.type = type;
	const periodicity = url.searchParams.get('periodicity');
	if (periodicity === 'mensuel' || periodicity === 'trimestriel' || periodicity === 'annuel') {
		filter.periodicity = periodicity;
	}
	const status = url.searchParams.get('status');
	if (status === 'active' || status === 'inactive') filter.status = status;
	return filter;
}

export const load: PageServerLoad = async ({ url }) => {
	const filter = parseFilters(url);
	const [summary, rows, accounts] = await Promise.all([
		computeSummary({ accountIds: filter.accountIds }),
		listEntries(filter),
		listAccountsForSelect()
	]);
	return { summary, entries: rows, accounts, filter };
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!Number.isFinite(id) || id <= 0) return fail(400);
		await deleteEntry(id);
		return { success: true };
	}
};
