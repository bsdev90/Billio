import bcrypt from 'bcryptjs';
import { and, eq, ne } from 'drizzle-orm';
import { db } from './db';
import { users, type User } from './db/schema';

export type PublicUser = Pick<
	User,
	'id' | 'login' | 'isAdmin' | 'forceReset' | 'createdAt' | 'updatedAt'
>;

function toPublic(u: User): PublicUser {
	return {
		id: u.id,
		login: u.login,
		isAdmin: u.isAdmin,
		forceReset: u.forceReset,
		createdAt: u.createdAt,
		updatedAt: u.updatedAt
	};
}

export async function listUsers(): Promise<PublicUser[]> {
	const rows = await db.select().from(users).orderBy(users.id);
	return rows.map(toPublic);
}

export async function findUserByLogin(login: string): Promise<PublicUser | null> {
	const normalized = login.trim().toLowerCase();
	const rows = await db.select().from(users).limit(200);
	const u = rows.find((r) => r.login.trim().toLowerCase() === normalized);
	return u ? toPublic(u) : null;
}

async function countAdmins(): Promise<number> {
	const rows = await db.select({ id: users.id }).from(users).where(eq(users.isAdmin, true));
	return rows.length;
}

export type CreateUserResult =
	| { ok: true; user: PublicUser }
	| { ok: false; reason: 'login_taken' | 'invalid' };

export async function createUser(input: {
	login: string;
	password: string;
	isAdmin: boolean;
}): Promise<CreateUserResult> {
	const login = input.login.trim();
	if (!login || input.password.length < 8) return { ok: false, reason: 'invalid' };
	const existing = await findUserByLogin(login);
	if (existing) return { ok: false, reason: 'login_taken' };
	const hash = await bcrypt.hash(input.password, 10);
	const [row] = await db
		.insert(users)
		.values({
			login,
			passwordHash: hash,
			isAdmin: input.isAdmin,
			forceReset: false
		})
		.returning();
	return { ok: true, user: toPublic(row) };
}

export type DeleteUserResult =
	| { ok: true }
	| { ok: false; reason: 'self' | 'last_admin' | 'not_found' };

export async function deleteUser(actorId: number, targetId: number): Promise<DeleteUserResult> {
	if (actorId === targetId) return { ok: false, reason: 'self' };
	const rows = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
	const target = rows[0];
	if (!target) return { ok: false, reason: 'not_found' };
	if (target.isAdmin) {
		const otherAdmins = await db
			.select({ id: users.id })
			.from(users)
			.where(and(eq(users.isAdmin, true), ne(users.id, targetId)));
		if (otherAdmins.length === 0) return { ok: false, reason: 'last_admin' };
	}
	await db.delete(users).where(eq(users.id, targetId));
	return { ok: true };
}

export type UpdateUserResult =
	| { ok: true; user: PublicUser }
	| { ok: false; reason: 'invalid' | 'login_taken' | 'last_admin' | 'not_found' };

export async function updateUser(
	actorId: number,
	targetId: number,
	input: { login: string; password: string; isAdmin: boolean }
): Promise<UpdateUserResult> {
	const login = input.login.trim();
	if (!login) return { ok: false, reason: 'invalid' };
	if (input.password && input.password.length < 8) return { ok: false, reason: 'invalid' };

	const rows = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
	const target = rows[0];
	if (!target) return { ok: false, reason: 'not_found' };

	const conflict = await findUserByLogin(login);
	if (conflict && conflict.id !== targetId) return { ok: false, reason: 'login_taken' };

	if (target.isAdmin && !input.isAdmin) {
		if (actorId === targetId) return { ok: false, reason: 'last_admin' };
		const admins = await countAdmins();
		if (admins <= 1) return { ok: false, reason: 'last_admin' };
	}

	const patch: Partial<typeof users.$inferInsert> = {
		login,
		isAdmin: input.isAdmin
	};
	if (input.password) {
		patch.passwordHash = await bcrypt.hash(input.password, 10);
	}
	const [updated] = await db.update(users).set(patch).where(eq(users.id, targetId)).returning();
	return { ok: true, user: toPublic(updated) };
}

export async function getUser(id: number): Promise<PublicUser | null> {
	const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
	return rows[0] ? toPublic(rows[0]) : null;
}
