import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { updateCredentials } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const login = String(form.get('login') ?? '').trim();
		const password = String(form.get('password') ?? '');
		const confirm = String(form.get('confirm') ?? '');

		if (!login) return fail(400, { login, error: 'required' });
		if (password.length < 8) return fail(400, { login, error: 'short' });
		if (password !== confirm) return fail(400, { login, error: 'mismatch' });

		await updateCredentials(login, password);
		throw redirect(303, '/');
	}
};
