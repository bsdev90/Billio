import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { verifyCredentials, createSession } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(303, '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const login = String(form.get('login') ?? '').trim();
		const password = String(form.get('password') ?? '');

		if (!login || !password) {
			return fail(400, { login, error: true });
		}

		const user = await verifyCredentials(login, password);
		if (!user) {
			return fail(401, { login, error: true });
		}

		await createSession(cookies, user.id);
		throw redirect(303, '/');
	}
};
