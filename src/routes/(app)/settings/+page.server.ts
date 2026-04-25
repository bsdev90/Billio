import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { updateCredentials, verifyCredentials } from '$lib/server/auth';
import { getSetting, setSetting } from '$lib/server/settings-service';
import { isSupportedCurrency, type Currency } from '$lib/format';
import { locales, baseLocale } from '$lib/paraglide/runtime';
import {
	createAccount,
	deleteAccount,
	getAccount,
	listAccountsWithCounts,
	parseAccountForm,
	updateAccount
} from '$lib/server/accounts-service';

export const load: PageServerLoad = async ({ url }) => {
	const editId = Number(url.searchParams.get('edit'));
	const [login, accounts, editing, currencyRaw, localeRaw] = await Promise.all([
		getSetting('auth.login'),
		listAccountsWithCounts(),
		Number.isFinite(editId) && editId > 0 ? getAccount(editId) : Promise.resolve(null),
		getSetting('app.currency'),
		getSetting('app.locale')
	]);
	const currency: Currency =
		currencyRaw && isSupportedCurrency(currencyRaw) ? currencyRaw : 'EUR';
	const locale =
		localeRaw && (locales as readonly string[]).includes(localeRaw) ? localeRaw : baseLocale;
	return { login: login ?? '', accounts, editing, currency, locale };
};

export const actions: Actions = {
	credentials: async ({ request }) => {
		const form = await request.formData();
		const currentPassword = String(form.get('currentPassword') ?? '');
		const newLogin = String(form.get('newLogin') ?? '').trim();
		const newPassword = String(form.get('newPassword') ?? '');
		const confirmPassword = String(form.get('confirmPassword') ?? '');

		const currentLogin = await getSetting('auth.login');
		if (!currentLogin) return fail(500, { error: 'no_login' });

		const okCurrent = await verifyCredentials(currentLogin, currentPassword);
		if (!okCurrent) {
			return fail(401, { error: 'current_password', newLogin });
		}

		if (!newLogin) return fail(400, { error: 'required', newLogin });
		if (newPassword.length < 8) return fail(400, { error: 'short', newLogin });
		if (newPassword !== confirmPassword) return fail(400, { error: 'mismatch', newLogin });

		await updateCredentials(newLogin, newPassword);
		return { saved: true };
	},
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
	currency: async ({ request }) => {
		const form = await request.formData();
		const code = String(form.get('currency') ?? '').trim().toUpperCase();
		if (!isSupportedCurrency(code)) return fail(400, { currencyError: 'invalid' });
		await setSetting('app.currency', code);
		throw redirect(303, '/settings?tab=preferences');
	},
	language: async ({ request }) => {
		const form = await request.formData();
		const code = String(form.get('locale') ?? '').trim();
		if (!(locales as readonly string[]).includes(code)) {
			return fail(400, { localeError: 'invalid' });
		}
		await setSetting('app.locale', code);
		throw redirect(303, '/settings?tab=preferences');
	}
};
