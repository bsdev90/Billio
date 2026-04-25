import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getEntry,
	listAccountsForSelect,
	parseEntryForm,
	updateEntry
} from '$lib/server/entries-service';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id) || id <= 0) throw error(404);
	const [entry, accounts] = await Promise.all([getEntry(id), listAccountsForSelect()]);
	if (!entry) throw error(404);
	return { entry, accounts };
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const id = Number(params.id);
		if (!Number.isFinite(id) || id <= 0) return fail(400);
		const form = await request.formData();
		const parsed = parseEntryForm(form);
		if (parsed.errors || !parsed.data) {
			return fail(400, { errors: parsed.errors ?? {}, raw: parsed.raw });
		}
		await updateEntry(id, parsed.data);
		throw redirect(303, '/');
	}
};
