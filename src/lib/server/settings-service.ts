import { db } from './db';
import { settings } from './db/schema';
import { eq } from 'drizzle-orm';

export async function getSetting(key: string): Promise<string | null> {
	const rows = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
	return rows[0]?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
	await db
		.insert(settings)
		.values({ key, value })
		.onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
	const rows = await db.select().from(settings);
	const map: Record<string, string> = {};
	for (const row of rows) {
		if (keys.includes(row.key)) map[row.key] = row.value;
	}
	return map;
}
