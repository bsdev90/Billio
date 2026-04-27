import { asc, count, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from './db';
import { accounts, entries } from './db/schema';

export const accountSchema = z.object({
	name: z.string().trim().min(1).max(100),
	color: z
		.string()
		.trim()
		.regex(/^#[0-9a-fA-F]{6}$/, 'hex'),
	position: z.coerce.number().int().min(0).default(0),
	hiddenByDefault: z.coerce.boolean().default(false)
});

export type AccountInput = z.infer<typeof accountSchema>;

export function parseAccountForm(form: FormData): {
	data?: AccountInput;
	errors?: Record<string, string>;
	raw: Record<string, FormDataEntryValue | null>;
} {
	const raw = {
		name: form.get('name'),
		color: form.get('color'),
		position: form.get('position'),
		hiddenByDefault: form.get('hiddenByDefault')
	};
	const result = accountSchema.safeParse({
		name: typeof raw.name === 'string' ? raw.name : '',
		color: typeof raw.color === 'string' ? raw.color : '',
		position: raw.position ?? 0,
		hiddenByDefault: raw.hiddenByDefault === 'on' || raw.hiddenByDefault === 'true'
	});
	if (!result.success) {
		const errors: Record<string, string> = {};
		for (const issue of result.error.issues) {
			const key = String(issue.path[0] ?? 'form');
			errors[key] = issue.code === 'custom' ? (issue.message || 'invalid') : issue.code;
		}
		return { errors, raw };
	}
	return { data: result.data, raw };
}

export async function listAccountsWithCounts() {
	const rows = await db
		.select({
			id: accounts.id,
			name: accounts.name,
			color: accounts.color,
			position: accounts.position,
			hiddenByDefault: accounts.hiddenByDefault,
			entriesCount: count(entries.id)
		})
		.from(accounts)
		.leftJoin(entries, eq(entries.accountId, accounts.id))
		.groupBy(accounts.id)
		.orderBy(asc(accounts.position), asc(accounts.id));
	return rows;
}

export async function getAccount(id: number) {
	const rows = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
	return rows[0] ?? null;
}

export async function createAccount(input: AccountInput) {
	const [row] = await db
		.insert(accounts)
		.values({
			name: input.name,
			color: input.color,
			position: input.position,
			hiddenByDefault: input.hiddenByDefault
		})
		.returning();
	return row;
}

export async function updateAccount(id: number, input: AccountInput) {
	const [row] = await db
		.update(accounts)
		.set({
			name: input.name,
			color: input.color,
			position: input.position,
			hiddenByDefault: input.hiddenByDefault,
			updatedAt: new Date()
		})
		.where(eq(accounts.id, id))
		.returning();
	return row;
}

export async function countEntriesForAccount(id: number): Promise<number> {
	const [row] = await db
		.select({ n: count(entries.id) })
		.from(entries)
		.where(eq(entries.accountId, id));
	return row?.n ?? 0;
}

export async function deleteAccount(id: number): Promise<{ ok: boolean; reason?: 'has_entries' }> {
	const n = await countEntriesForAccount(id);
	if (n > 0) return { ok: false, reason: 'has_entries' };
	await db.delete(accounts).where(eq(accounts.id, id));
	return { ok: true };
}
