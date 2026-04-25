import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import { dirname, resolve } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import { env } from '$env/dynamic/private';
import { db } from './index';
import { settings } from './schema';
import { eq } from 'drizzle-orm';

const DEFAULT_LOGIN = 'admin';
const DEFAULT_PASSWORD = 'admin';

let initialized = false;

function runMigrations() {
	if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
	const dbDir = dirname(env.DATABASE_URL);
	if (dbDir && dbDir !== '.' && !existsSync(dbDir)) {
		mkdirSync(dbDir, { recursive: true });
	}
	const migClient = new Database(env.DATABASE_URL);
	const migDb = drizzle(migClient);
	const migrationsFolder = resolve(process.cwd(), 'drizzle');
	migrate(migDb, { migrationsFolder });
	migClient.close();
}

async function seedDefaults() {
	const existing = await db
		.select()
		.from(settings)
		.where(eq(settings.key, 'auth.login'))
		.limit(1);

	if (existing.length > 0) return;

	const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

	await db.insert(settings).values([
		{ key: 'auth.login', value: DEFAULT_LOGIN },
		{ key: 'auth.password_hash', value: hash },
		{ key: 'auth.force_reset', value: '1' }
	]);
}

export async function bootstrap() {
	if (initialized) return;
	runMigrations();
	await seedDefaults();
	initialized = true;
}
