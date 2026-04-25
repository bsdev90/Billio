import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const accounts = sqliteTable(
	'accounts',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		name: text('name').notNull(),
		color: text('color').notNull(),
		position: integer('position').notNull().default(0),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date())
			.$onUpdate(() => new Date())
	},
	(t) => ({
		nameUnique: uniqueIndex('accounts_name_unique').on(t.name)
	})
);

export const entries = sqliteTable('entries', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	label: text('label').notNull(),
	type: text('type', { enum: ['abonnement', 'charge'] }).notNull(),
	day: integer('day'),
	periodicity: text('periodicity', {
		enum: ['mensuel', 'trimestriel', 'annuel']
	}).notNull(),
	amountCents: integer('amount_cents').notNull(),
	accountId: integer('account_id')
		.notNull()
		.references(() => accounts.id, { onDelete: 'restrict' }),
	notes: text('notes'),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
		.$onUpdate(() => new Date())
});

export const settings = sqliteTable('settings', {
	key: text('key').primaryKey(),
	value: text('value').notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
		.$onUpdate(() => new Date())
});

export const accountsRelations = relations(accounts, ({ many }) => ({
	entries: many(entries)
}));

export const entriesRelations = relations(entries, ({ one }) => ({
	account: one(accounts, {
		fields: [entries.accountId],
		references: [accounts.id]
	})
}));

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;
export type Periodicity = Entry['periodicity'];
export type EntryType = Entry['type'];
