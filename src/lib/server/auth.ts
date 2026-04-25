import bcrypt from 'bcryptjs';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getSetting, setSetting } from './settings-service';

const COOKIE_NAME = 'billio_session';
const SESSION_TTL_SECONDS = Number(env.APP_SESSION_TTL ?? 60 * 60 * 24 * 30);

async function getSecret(): Promise<string> {
	if (env.APP_SESSION_SECRET) return env.APP_SESSION_SECRET;
	let secret = await getSetting('session.secret');
	if (!secret) {
		secret = randomBytes(32).toString('hex');
		await setSetting('session.secret', secret);
	}
	return secret;
}

function sign(value: string, secret: string): string {
	return createHmac('sha256', secret).update(value).digest('base64url');
}

function safeEquals(a: string, b: string): boolean {
	const bufA = Buffer.from(a);
	const bufB = Buffer.from(b);
	if (bufA.length !== bufB.length) return false;
	return timingSafeEqual(bufA, bufB);
}

export async function verifyCredentials(login: string, password: string): Promise<boolean> {
	const storedLogin = await getSetting('auth.login');
	const storedHash = await getSetting('auth.password_hash');
	if (!storedLogin || !storedHash) return false;
	if (storedLogin.trim().toLowerCase() !== login.trim().toLowerCase()) {
		// still run bcrypt to avoid timing leak
		await bcrypt.compare(password, storedHash);
		return false;
	}
	return bcrypt.compare(password, storedHash);
}

export async function createSession(cookies: Cookies): Promise<void> {
	const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
	const payload = String(expiresAt);
	const secret = await getSecret();
	const token = `${payload}.${sign(payload, secret)}`;
	cookies.set(COOKIE_NAME, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: env.NODE_ENV === 'production',
		maxAge: SESSION_TTL_SECONDS
	});
}

export async function destroySession(cookies: Cookies): Promise<void> {
	cookies.delete(COOKIE_NAME, { path: '/' });
}

export async function isAuthenticated(cookies: Cookies): Promise<boolean> {
	const token = cookies.get(COOKIE_NAME);
	if (!token) return false;
	const [payload, sig] = token.split('.');
	if (!payload || !sig) return false;
	const secret = await getSecret();
	const expected = sign(payload, secret);
	if (!safeEquals(sig, expected)) return false;
	const expiresAt = Number(payload);
	if (!Number.isFinite(expiresAt)) return false;
	return expiresAt * 1000 > Date.now();
}

export async function isForceReset(): Promise<boolean> {
	const v = await getSetting('auth.force_reset');
	return v === '1';
}

export async function updateCredentials(newLogin: string, newPassword: string): Promise<void> {
	const hash = await bcrypt.hash(newPassword, 10);
	await setSetting('auth.login', newLogin);
	await setSetting('auth.password_hash', hash);
	await setSetting('auth.force_reset', '0');
}

export const AUTH_COOKIE = COOKIE_NAME;
