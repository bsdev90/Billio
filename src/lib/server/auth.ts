import bcrypt from 'bcryptjs';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { db } from './db';
import { users, type User } from './db/schema';
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

export type SessionUser = Pick<User, 'id' | 'login' | 'isAdmin' | 'forceReset'>;

export async function verifyCredentials(
	login: string,
	password: string
): Promise<SessionUser | null> {
	const normalized = login.trim().toLowerCase();
	const rows = await db.select().from(users).limit(50);
	const user = rows.find((u) => u.login.trim().toLowerCase() === normalized) ?? null;
	if (!user) {
		// avoid timing leak
		await bcrypt.compare(password, '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinval');
		return null;
	}
	const ok = await bcrypt.compare(password, user.passwordHash);
	if (!ok) return null;
	return { id: user.id, login: user.login, isAdmin: user.isAdmin, forceReset: user.forceReset };
}

export async function createSession(cookies: Cookies, userId: number): Promise<void> {
	const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
	const payload = `${userId}.${expiresAt}`;
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

export async function getSessionUser(cookies: Cookies): Promise<SessionUser | null> {
	const token = cookies.get(COOKIE_NAME);
	if (!token) return null;
	const parts = token.split('.');
	if (parts.length !== 3) return null;
	const [userIdStr, expiresAtStr, sig] = parts;
	const payload = `${userIdStr}.${expiresAtStr}`;
	const secret = await getSecret();
	const expected = sign(payload, secret);
	if (!safeEquals(sig, expected)) return null;
	const expiresAt = Number(expiresAtStr);
	if (!Number.isFinite(expiresAt) || expiresAt * 1000 <= Date.now()) return null;
	const userId = Number(userIdStr);
	if (!Number.isFinite(userId) || userId <= 0) return null;
	const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
	const user = rows[0];
	if (!user) return null;
	return { id: user.id, login: user.login, isAdmin: user.isAdmin, forceReset: user.forceReset };
}

export async function verifyUserPassword(userId: number, password: string): Promise<boolean> {
	const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
	const user = rows[0];
	if (!user) {
		await bcrypt.compare(password, '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinval');
		return false;
	}
	return bcrypt.compare(password, user.passwordHash);
}

export async function updateOwnCredentials(
	userId: number,
	newLogin: string,
	newPassword: string
): Promise<void> {
	const hash = await bcrypt.hash(newPassword, 10);
	await db
		.update(users)
		.set({ login: newLogin, passwordHash: hash, forceReset: false })
		.where(eq(users.id, userId));
}

export const AUTH_COOKIE = COOKIE_NAME;
