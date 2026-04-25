import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { getTextDirection, locales, baseLocale } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { bootstrap } from '$lib/server/db/bootstrap';
import { isAuthenticated, isForceReset } from '$lib/server/auth';
import { getSetting } from '$lib/server/settings-service';

const PUBLIC_ROUTES = new Set(['/login']);
const RESET_ROUTE = '/force-reset';

let bootstrapPromise: Promise<void> | null = null;
function ensureBootstrapped() {
	if (!bootstrapPromise) bootstrapPromise = bootstrap();
	return bootstrapPromise;
}

const handleBootstrap: Handle = async ({ event, resolve }) => {
	await ensureBootstrapped();
	return resolve(event);
};

const handleAuth: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	const authed = await isAuthenticated(event.cookies);
	event.locals.authenticated = authed;
	event.locals.forceReset = false;

	if (PUBLIC_ROUTES.has(path)) {
		if (authed && path === '/login') throw redirect(303, '/');
		return resolve(event);
	}

	if (!authed) {
		throw redirect(303, '/login');
	}

	const forceReset = await isForceReset();
	event.locals.forceReset = forceReset;
	if (forceReset && path !== RESET_ROUTE && !path.startsWith('/logout')) {
		throw redirect(303, RESET_ROUTE);
	}
	if (!forceReset && path === RESET_ROUTE) {
		throw redirect(303, '/');
	}

	return resolve(event);
};

const handleParaglide: Handle = async ({ event, resolve }) => {
	// Language is a global app setting (single locale shared by every visitor),
	// so we override the PARAGLIDE_LOCALE cookie in the incoming request before
	// Paraglide reads it. Per-browser locales are intentionally ignored.
	const stored = await getSetting('app.locale');
	const desired: string =
		stored && (locales as readonly string[]).includes(stored) ? stored : baseLocale;

	const cookieHeader = event.request.headers.get('cookie') ?? '';
	const cookies = cookieHeader
		.split('; ')
		.filter((c) => c && !c.startsWith('PARAGLIDE_LOCALE='));
	cookies.push(`PARAGLIDE_LOCALE=${desired}`);

	const headers = new Headers(event.request.headers);
	headers.set('cookie', cookies.join('; '));

	const init: RequestInit & { duplex?: 'half' } = {
		method: event.request.method,
		headers
	};
	if (event.request.method !== 'GET' && event.request.method !== 'HEAD') {
		init.body = event.request.body;
		init.duplex = 'half';
	}
	const requestWithLocale = new Request(event.request.url, init);

	// Keep the browser cookie aligned with the global setting so the client-side
	// Paraglide runtime stays in sync after navigations.
	event.cookies.set('PARAGLIDE_LOCALE', desired, {
		path: '/',
		httpOnly: false,
		sameSite: 'strict',
		secure: false,
		maxAge: 60 * 60 * 24 * 365
	});

	return paraglideMiddleware(requestWithLocale, ({ request, locale }) => {
		event.request = request;
		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html
					.replace('%paraglide.lang%', locale)
					.replace('%paraglide.dir%', getTextDirection(locale))
		});
	});
};

export const handle: Handle = sequence(handleBootstrap, handleParaglide, handleAuth);
