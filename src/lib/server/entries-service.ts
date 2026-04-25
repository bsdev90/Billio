import { and, asc, desc, eq, inArray, SQL } from 'drizzle-orm';
import { z } from 'zod';
import { db } from './db';
import { accounts, entries } from './db/schema';
import { parseAmountToCents } from '$lib/format';

export const entrySchema = z.object({
	label: z.string().trim().min(1).max(200),
	type: z.enum(['abonnement', 'charge']),
	accountId: z.number().int().positive(),
	periodicity: z.enum(['mensuel', 'trimestriel', 'annuel']),
	amountCents: z.number().int().positive(),
	day: z.number().int().min(1).max(31).nullable(),
	notes: z.string().max(2000).nullable(),
	isActive: z.boolean()
});

export type EntryInput = z.infer<typeof entrySchema>;

export function parseEntryForm(form: FormData): {
	data?: EntryInput;
	errors?: Record<string, string>;
	raw: Record<string, string | null>;
} {
	const raw: Record<string, string | null> = {
		label: typeof form.get('label') === 'string' ? (form.get('label') as string) : null,
		type: typeof form.get('type') === 'string' ? (form.get('type') as string) : null,
		accountId: typeof form.get('accountId') === 'string' ? (form.get('accountId') as string) : null,
		periodicity:
			typeof form.get('periodicity') === 'string' ? (form.get('periodicity') as string) : null,
		amount: typeof form.get('amount') === 'string' ? (form.get('amount') as string) : null,
		day: typeof form.get('day') === 'string' ? (form.get('day') as string) : null,
		notes: typeof form.get('notes') === 'string' ? (form.get('notes') as string) : null,
		isActive: typeof form.get('isActive') === 'string' ? (form.get('isActive') as string) : null
	};

	const amountCents = parseAmountToCents(raw.amount ?? '');
	const errors: Record<string, string> = {};
	if (amountCents === null || amountCents <= 0) errors.amount = 'positive';

	const accountId = raw.accountId ? Number(raw.accountId) : NaN;
	if (!Number.isFinite(accountId) || accountId <= 0) errors.accountId = 'required';

	let day: number | null = null;
	if (raw.day && raw.day.trim() !== '') {
		const d = Number(raw.day);
		if (!Number.isFinite(d) || d < 1 || d > 31) errors.day = 'day_range';
		else day = d;
	}

	const notes = raw.notes && raw.notes.trim() !== '' ? raw.notes.trim() : null;
	const isActive = raw.isActive === 'on' || raw.isActive === 'true';

	const candidate = {
		label: raw.label ?? '',
		type: raw.type,
		accountId,
		periodicity: raw.periodicity,
		amountCents: amountCents ?? 0,
		day,
		notes,
		isActive
	};

	if (Object.keys(errors).length > 0) {
		return { errors, raw };
	}

	const result = entrySchema.safeParse(candidate);
	if (!result.success) {
		for (const issue of result.error.issues) {
			const key = String(issue.path[0] ?? 'form');
			errors[key] = issue.code;
		}
		return { errors, raw };
	}
	return { data: result.data, raw };
}

export type EntryFilter = {
	accountIds?: number[];
	type?: 'abonnement' | 'charge';
	periodicity?: 'mensuel' | 'trimestriel' | 'annuel';
	status?: 'active' | 'inactive';
};

export async function listEntries(filter: EntryFilter = {}) {
	const conditions: SQL[] = [];
	if (filter.accountIds && filter.accountIds.length > 0) {
		conditions.push(inArray(entries.accountId, filter.accountIds));
	}
	if (filter.type) conditions.push(eq(entries.type, filter.type));
	if (filter.periodicity) conditions.push(eq(entries.periodicity, filter.periodicity));
	if (filter.status === 'active') conditions.push(eq(entries.isActive, true));
	else if (filter.status === 'inactive') conditions.push(eq(entries.isActive, false));

	const where =
		conditions.length === 0
			? undefined
			: conditions.length === 1
				? conditions[0]
				: and(...conditions);

	const rows = await db
		.select({
			id: entries.id,
			label: entries.label,
			type: entries.type,
			day: entries.day,
			periodicity: entries.periodicity,
			amountCents: entries.amountCents,
			notes: entries.notes,
			isActive: entries.isActive,
			accountId: entries.accountId,
			accountName: accounts.name,
			accountColor: accounts.color
		})
		.from(entries)
		.leftJoin(accounts, eq(accounts.id, entries.accountId))
		.where(where)
		.orderBy(desc(entries.isActive), asc(entries.label));

	return rows;
}

export async function getEntry(id: number) {
	const rows = await db.select().from(entries).where(eq(entries.id, id)).limit(1);
	return rows[0] ?? null;
}

export async function createEntry(input: EntryInput) {
	const [row] = await db
		.insert(entries)
		.values({
			label: input.label,
			type: input.type,
			accountId: input.accountId,
			periodicity: input.periodicity,
			amountCents: input.amountCents,
			day: input.day,
			notes: input.notes,
			isActive: input.isActive
		})
		.returning();
	return row;
}

export async function updateEntry(id: number, input: EntryInput) {
	const [row] = await db
		.update(entries)
		.set({
			label: input.label,
			type: input.type,
			accountId: input.accountId,
			periodicity: input.periodicity,
			amountCents: input.amountCents,
			day: input.day,
			notes: input.notes,
			isActive: input.isActive,
			updatedAt: new Date()
		})
		.where(eq(entries.id, id))
		.returning();
	return row;
}

export async function toggleEntry(id: number) {
	const current = await getEntry(id);
	if (!current) return null;
	const [row] = await db
		.update(entries)
		.set({ isActive: !current.isActive, updatedAt: new Date() })
		.where(eq(entries.id, id))
		.returning();
	return row;
}

export async function deleteEntry(id: number) {
	await db.delete(entries).where(eq(entries.id, id));
}

export async function listAccountsForSelect() {
	return db
		.select({ id: accounts.id, name: accounts.name, color: accounts.color })
		.from(accounts)
		.orderBy(asc(accounts.position), asc(accounts.id));
}
