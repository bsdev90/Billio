import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createEntry, listAccountsForSelect, parseEntryForm } from '$lib/server/entries-service';

export const load: PageServerLoad = async () => {
	const accounts = await listAccountsForSelect();
	return { accounts };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const parsed = parseEntryForm(form);
		if (parsed.errors || !parsed.data) {
			return fail(400, { errors: parsed.errors ?? {}, raw: parsed.raw });
		}
		await createEntry(parsed.data);
		throw redirect(303, '/');
	}
};
