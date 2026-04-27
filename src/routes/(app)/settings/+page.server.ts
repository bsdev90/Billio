import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getSetting, setSetting } from '$lib/server/settings-service';
import { isSupportedCurrency, type Currency } from '$lib/format';
import { locales, baseLocale } from '$lib/paraglide/runtime';
import {
	createAccount,
	deleteAccount,
	listAccountsWithCounts,
	parseAccountForm,
	updateAccount
} from '$lib/server/accounts-service';
import { createUser, deleteUser, listUsers, updateUser } from '$lib/server/users-service';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user?.isAdmin) throw redirect(303, '/');
	const [accounts, usersList, currencyRaw, localeRaw] = await Promise.all([
		listAccountsWithCounts(),
		listUsers(),
		getSetting('app.currency'),
		getSetting('app.locale')
	]);
	const currency: Currency =
		currencyRaw && isSupportedCurrency(currencyRaw) ? currencyRaw : 'EUR';
	const locale =
		localeRaw && (locales as readonly string[]).includes(localeRaw) ? localeRaw : baseLocale;
	return {
		currentUserId: locals.user.id,
		accounts,
		users: usersList,
		currency,
		locale
	};
};

export const actions: Actions = {
	saveAccount: async ({ request }) => {
		const form = await request.formData();
		const idStr = form.get('id');
		const id = idStr ? Number(idStr) : null;
		const parsed = parseAccountForm(form);
		if (parsed.errors || !parsed.data) {
			return fail(400, { errors: parsed.errors ?? {}, raw: parsed.raw, editingId: id });
		}
		if (id && id > 0) {
			await updateAccount(id, parsed.data);
		} else {
			await createAccount(parsed.data);
		}
		throw redirect(303, '/settings');
	},
	deleteAccount: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!Number.isFinite(id) || id <= 0) return fail(400);
		const result = await deleteAccount(id);
		if (!result.ok) {
			return fail(409, { deleteError: result.reason });
		}
		throw redirect(303, '/settings');
	},
	saveUser: async ({ request, locals }) => {
		if (!locals.user?.isAdmin) throw redirect(303, '/');
		const form = await request.formData();
		const idStr = form.get('id');
		const id = idStr ? Number(idStr) : null;
		const login = String(form.get('login') ?? '').trim();
		const password = String(form.get('password') ?? '');
		const isAdmin = form.get('isAdmin') === 'on';

		if (id && id > 0) {
			const result = await updateUser(locals.user.id, id, { login, password, isAdmin });
			if (!result.ok) {
				return fail(400, {
					userError: result.reason,
					raw: { id, login, isAdmin }
				});
			}
			throw redirect(303, '/settings?tab=users&saved=1');
		}

		const result = await createUser({ login, password, isAdmin });
		if (!result.ok) {
			return fail(400, {
				userError: result.reason,
				raw: { login, isAdmin }
			});
		}
		throw redirect(303, '/settings?tab=users&created=1');
	},
	deleteUser: async ({ request, locals }) => {
		if (!locals.user?.isAdmin) throw redirect(303, '/');
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!Number.isFinite(id) || id <= 0) return fail(400);
		const result = await deleteUser(locals.user.id, id);
		if (!result.ok) {
			return fail(409, { userError: result.reason });
		}
		throw redirect(303, '/settings?tab=users');
	},
	currency: async ({ request, locals }) => {
		if (!locals.user?.isAdmin) throw redirect(303, '/');
		const form = await request.formData();
		const code = String(form.get('currency') ?? '').trim().toUpperCase();
		if (!isSupportedCurrency(code)) return fail(400, { currencyError: 'invalid' });
		await setSetting('app.currency', code);
		throw redirect(303, '/settings?tab=preferences');
	},
	language: async ({ request, locals }) => {
		if (!locals.user?.isAdmin) throw redirect(303, '/');
		const form = await request.formData();
		const code = String(form.get('locale') ?? '').trim();
		if (!(locales as readonly string[]).includes(code)) {
			return fail(400, { localeError: 'invalid' });
		}
		await setSetting('app.locale', code);
		throw redirect(303, '/settings?tab=preferences');
	}
};
