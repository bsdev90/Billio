<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { formatCents } from '$lib/format';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import {
		monthlyLissedCents,
		contrastText,
		SUBSCRIPTION_COLOR,
		CHARGE_COLOR
	} from '$lib/budget-utils';
	import SummaryBlocks from '$lib/components/SummaryBlocks.svelte';
	import PieChart from '$lib/components/PieChart.svelte';
	import BarsChart from '$lib/components/BarsChart.svelte';
	import DonutChart from '$lib/components/DonutChart.svelte';
	import EntryForm from '$lib/components/EntryForm.svelte';
	import Modal from '$lib/components/Modal.svelte';

	let { data } = $props();

	type EntryRow = (typeof data.entries)[number];

	let entryModalOpen = $state(false);
	let editingEntry = $state<EntryRow | null>(null);

	function openNewEntry() {
		editingEntry = null;
		entryModalOpen = true;
	}

	function openEditEntry(entry: EntryRow) {
		editingEntry = entry;
		entryModalOpen = true;
	}

	const entryFormInitial = $derived(
		editingEntry
			? {
					label: editingEntry.label,
					type: editingEntry.type,
					accountId: editingEntry.accountId,
					periodicity: editingEntry.periodicity,
					amount: (editingEntry.amountCents / 100).toFixed(2).replace('.', ','),
					day: editingEntry.day != null ? String(editingEntry.day) : '',
					notes: editingEntry.notes ?? '',
					isActive: editingEntry.isActive
				}
			: {
					label: '',
					type: 'abonnement' as const,
					accountId: data.accounts[0]?.id ?? null,
					periodicity: 'mensuel' as const,
					amount: '',
					day: '',
					notes: '',
					isActive: true
				}
	);

	const entryFormAction = $derived(
		editingEntry ? `/entries/${editingEntry.id}/edit` : '/entries/new'
	);

	const entryFormTitle = $derived(
		editingEntry ? m.entries_form_edit_title() : m.entries_form_new_title()
	);

	function gotoUrl(url: URL) {
		goto(url, { replaceState: true, noScroll: true, keepFocus: true });
	}

	const summary = $derived(data.summary);

	const pieSlices = $derived(
		summary.rows
			.filter((r) => r.totalsCents.monthly > 0)
			.map((r) => ({
				label: r.accountName,
				value: r.totalsCents.monthly,
				color: r.accountColor ?? '#94a3b8'
			}))
	);

	const barGroups = $derived(
		summary.rows.map((r) => ({
			label: r.accountName,
			abonnementCents: r.lissedByType.abonnement,
			chargeCents: r.lissedByType.charge
		}))
	);

	const donutSlices = $derived([
		{
			label: m.type_subscription(),
			value: summary.total.lissedByType.abonnement,
			color: SUBSCRIPTION_COLOR
		},
		{
			label: m.type_charge(),
			value: summary.total.lissedByType.charge,
			color: CHARGE_COLOR
		}
	]);

	function updateFilter(name: string, value: string) {
		const url = new URL(window.location.href);
		if (value === '') url.searchParams.delete(name);
		else url.searchParams.set(name, value);
		gotoUrl(url);
	}

	const defaultActiveAccountIds = $derived(
		new Set(data.accounts.filter((a) => !a.hiddenByDefault).map((a) => a.id))
	);

	const activeAccountIds = $derived(
		data.filter.accountIds && data.filter.accountIds.length > 0
			? new Set(data.filter.accountIds)
			: defaultActiveAccountIds
	);

	function toggleAccount(id: number) {
		const next = new Set(activeAccountIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		const url = new URL(window.location.href);
		const matchesDefault =
			next.size === defaultActiveAccountIds.size &&
			[...next].every((nId) => defaultActiveAccountIds.has(nId));
		if (matchesDefault) {
			url.searchParams.delete('accounts');
		} else {
			url.searchParams.set('accounts', [...next].join(','));
		}
		gotoUrl(url);
	}

	function periodicityLabel(p: 'mensuel' | 'trimestriel' | 'annuel') {
		if (p === 'mensuel') return m.periodicity_monthly();
		if (p === 'trimestriel') return m.periodicity_quarterly();
		return m.periodicity_yearly();
	}

	function typeLabel(t: 'abonnement' | 'charge') {
		return t === 'abonnement' ? m.type_subscription() : m.type_charge();
	}

	function handleDelete(e: SubmitEvent) {
		if (!confirm(m.entries_confirm_delete())) e.preventDefault();
	}

	type SortKey = 'label' | 'type' | 'account' | 'periodicity' | 'amount' | 'monthly' | 'day';
	let sortKey = $state<SortKey>('label');
	let sortDir = $state<'asc' | 'desc'>('asc');

	const PERIODICITY_RANK = { mensuel: 0, trimestriel: 1, annuel: 2 } as const;
	const TYPE_RANK = { abonnement: 0, charge: 1 } as const;

	const sortedEntries = $derived.by(() => {
		const list = [...data.entries];
		const dir = sortDir === 'asc' ? 1 : -1;
		list.sort((a, b) => {
			let cmp = 0;
			switch (sortKey) {
				case 'label':
					cmp = a.label.localeCompare(b.label);
					break;
				case 'type':
					cmp = TYPE_RANK[a.type] - TYPE_RANK[b.type];
					break;
				case 'account':
					cmp = (a.accountName ?? '').localeCompare(b.accountName ?? '');
					break;
				case 'periodicity':
					cmp = PERIODICITY_RANK[a.periodicity] - PERIODICITY_RANK[b.periodicity];
					break;
				case 'amount':
					cmp = a.amountCents - b.amountCents;
					break;
				case 'monthly':
					cmp = monthlyLissedCents(a) - monthlyLissedCents(b);
					break;
				case 'day': {
					const da = a.day ?? Number.POSITIVE_INFINITY;
					const db = b.day ?? Number.POSITIVE_INFINITY;
					cmp = da - db;
					break;
				}
			}
			if (cmp === 0) cmp = a.label.localeCompare(b.label);
			return cmp * dir;
		});
		return list;
	});

	function setSort(key: SortKey) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = 'asc';
		}
	}

	function sortIcon(k: SortKey): string {
		if (sortKey !== k) return '';
		return sortDir === 'asc' ? '▲' : '▼';
	}
</script>

<svelte:head><title>{m.dashboard_title()} · {m.app_name()}</title></svelte:head>

<div>
	<div
		class="mb-3 flex flex-col items-start gap-3 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center"
	>
		<h1 class="text-2xl font-semibold text-slate-900">{m.dashboard_title()}</h1>

		{#if data.accounts.length > 0}
			<div
				class="flex w-full flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm md:inline-flex md:w-auto md:justify-self-center md:py-1.5"
			>
				<span class="text-sm font-medium text-slate-500">
					{m.entries_filter_account()}
				</span>
				{#each data.accounts as a (a.id)}
					{@const active = activeAccountIds.has(a.id)}
					<button
						type="button"
						onclick={() => toggleAccount(a.id)}
						class="grow cursor-pointer rounded-full border border-transparent px-3 py-1 text-xs font-semibold transition hover:brightness-95 md:grow-0"
						style={active
							? `background-color: ${a.color}; color: ${contrastText(a.color)};`
							: 'background-color: #f1f5f9; color: #94a3b8;'}
					>
						{a.name}
					</button>
				{/each}
			</div>
		{/if}

		<div class="hidden md:block"></div>
	</div>

	{#if data.accounts.length === 0}
		<div
			class="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500"
		>
			{m.dashboard_empty()}
		</div>
	{:else}
		<div class="space-y-8">
			<section class="rounded-lg border border-slate-200 bg-white px-4 pt-0 pb-4 shadow-sm sm:p-6">
				<SummaryBlocks {summary} />
			</section>

			<section>
				<div class="grid gap-4 lg:grid-cols-3">
					<PieChart slices={pieSlices} title={m.dashboard_chart_pie_title()} />
					<BarsChart groups={barGroups} title={m.dashboard_chart_bars_title()} />
					<DonutChart slices={donutSlices} title={m.dashboard_chart_donut_title()} />
				</div>
			</section>

		<section class="space-y-3">
			<h2 class="text-lg font-medium text-slate-900">{m.entries_title()}</h2>

			<div
				class="grid grid-cols-3 gap-2 text-sm sm:flex sm:flex-wrap sm:items-center sm:gap-3"
			>
				<label class="contents sm:flex sm:items-center sm:gap-2">
					<span class="hidden text-slate-500 sm:inline">{m.entries_filter_type()}</span>
					<select
						value={data.filter.type ?? ''}
						onchange={(e) => updateFilter('type', e.currentTarget.value)}
						class="w-full min-w-0 rounded-md border border-slate-300 bg-white py-1.5 pr-7 pl-2 text-xs sm:w-auto sm:min-w-[10rem] sm:text-sm"
					>
						<option value="">{m.entries_filter_type()}</option>
						<option value="abonnement">{m.type_subscription()}</option>
						<option value="charge">{m.type_charge()}</option>
					</select>
				</label>
				<label class="contents sm:flex sm:items-center sm:gap-2">
					<span class="hidden text-slate-500 sm:inline">{m.entries_filter_periodicity()}</span>
					<select
						value={data.filter.periodicity ?? ''}
						onchange={(e) => updateFilter('periodicity', e.currentTarget.value)}
						class="w-full min-w-0 rounded-md border border-slate-300 bg-white py-1.5 pr-7 pl-2 text-xs sm:w-auto sm:min-w-[10rem] sm:text-sm"
					>
						<option value="">{m.entries_filter_periodicity()}</option>
						<option value="mensuel">{m.periodicity_monthly()}</option>
						<option value="trimestriel">{m.periodicity_quarterly()}</option>
						<option value="annuel">{m.periodicity_yearly()}</option>
					</select>
				</label>
				<label class="contents sm:flex sm:items-center sm:gap-2">
					<span class="hidden text-slate-500 sm:inline">{m.entries_filter_status()}</span>
					<select
						value={data.filter.status ?? ''}
						onchange={(e) => updateFilter('status', e.currentTarget.value)}
						class="w-full min-w-0 rounded-md border border-slate-300 bg-white py-1.5 pr-7 pl-2 text-xs sm:w-auto sm:min-w-[9rem] sm:text-sm"
					>
						<option value="">{m.entries_filter_status()}</option>
						<option value="active">{m.entries_filter_active()}</option>
						<option value="inactive">{m.entries_filter_inactive()}</option>
					</select>
				</label>

				<button
					type="button"
					onclick={openNewEntry}
					class="col-span-3 cursor-pointer rounded-md bg-slate-900 px-3 py-1.5 text-center text-sm font-medium text-white hover:bg-slate-800 sm:col-span-1 sm:ml-auto"
				>
					+ {m.entries_add()}
				</button>
			</div>

			{#if data.entries.length === 0}
				<div
					class="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500"
				>
					{m.entries_empty()}
				</div>
			{:else}
				<div class="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
					<table class="min-w-full text-sm">
						<thead class="bg-slate-50 text-slate-600">
							<tr class="text-left">
								<th class="px-3 py-2 font-medium md:px-4">
									<button
										type="button"
										onclick={() => setSort('label')}
										class="inline-flex cursor-pointer items-center gap-1 hover:text-slate-900"
									>
										{m.entries_column_label()}
										<span class="text-xs text-slate-400">{sortIcon('label')}</span>
									</button>
								</th>
								<th class="hidden px-4 py-2 font-medium md:table-cell">
									<button
										type="button"
										onclick={() => setSort('type')}
										class="inline-flex cursor-pointer items-center gap-1 hover:text-slate-900"
									>
										{m.entries_column_type()}
										<span class="text-xs text-slate-400">{sortIcon('type')}</span>
									</button>
								</th>
								<th class="hidden px-4 py-2 font-medium md:table-cell">
									<button
										type="button"
										onclick={() => setSort('account')}
										class="inline-flex cursor-pointer items-center gap-1 hover:text-slate-900"
									>
										{m.entries_column_account()}
										<span class="text-xs text-slate-400">{sortIcon('account')}</span>
									</button>
								</th>
								<th class="hidden px-4 py-2 font-medium md:table-cell">
									<button
										type="button"
										onclick={() => setSort('periodicity')}
										class="inline-flex cursor-pointer items-center gap-1 hover:text-slate-900"
									>
										{m.entries_column_periodicity()}
										<span class="text-xs text-slate-400">{sortIcon('periodicity')}</span>
									</button>
								</th>
								<th class="px-3 py-2 text-right font-medium md:px-4">
									<button
										type="button"
										onclick={() => setSort('amount')}
										class="inline-flex w-full cursor-pointer items-center justify-end gap-1 hover:text-slate-900"
									>
										{m.entries_column_amount()}
										<span class="text-xs text-slate-400">{sortIcon('amount')}</span>
									</button>
								</th>
								<th class="hidden px-4 py-2 text-right font-medium md:table-cell">
									<button
										type="button"
										onclick={() => setSort('monthly')}
										class="inline-flex w-full cursor-pointer items-center justify-end gap-1 hover:text-slate-900"
									>
										{m.entries_column_monthly_lissed()}
										<span class="text-xs text-slate-400">{sortIcon('monthly')}</span>
									</button>
								</th>
								<th class="hidden px-4 py-2 text-center font-medium md:table-cell">
									<button
										type="button"
										onclick={() => setSort('day')}
										class="inline-flex w-full cursor-pointer items-center justify-center gap-1 hover:text-slate-900"
									>
										{m.entries_column_day()}
										<span class="text-xs text-slate-400">{sortIcon('day')}</span>
									</button>
								</th>
								<th class="hidden px-4 py-2 font-medium md:table-cell">
									{m.entries_column_notes()}
								</th>
								<th class="px-3 py-2 text-right font-medium md:px-4">
									{m.entries_column_actions()}
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100">
							{#each sortedEntries as entry (entry.id)}
								<tr class={entry.isActive ? '' : 'text-slate-400'}>
									<td class="px-3 py-2 font-medium md:px-4">
										<div class="flex flex-col gap-0.5 md:contents">
											<span class="inline-flex items-center gap-1.5">
												<span
													class="inline-block h-2 w-2 shrink-0 rounded-full md:hidden"
													style="background-color: {entry.type === 'abonnement'
														? SUBSCRIPTION_COLOR
														: CHARGE_COLOR}"
												></span>
												<span class="truncate">{entry.label}</span>
											</span>
											<span
												class="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] font-normal text-slate-500 md:hidden"
											>
												<span
													class="inline-block h-1.5 w-1.5 rounded-full"
													style="background-color: {entry.accountColor ?? '#94a3b8'}"
												></span>
												<span>{entry.accountName}</span>
												<span class="text-slate-300">·</span>
												<span>{periodicityLabel(entry.periodicity)}</span>
											</span>
										</div>
									</td>
									<td class="hidden px-4 py-2 md:table-cell">
										<span class="inline-flex items-center gap-1.5">
											<span
												class="inline-block h-2 w-2 rounded-full"
												style="background-color: {entry.type === 'abonnement'
													? SUBSCRIPTION_COLOR
													: CHARGE_COLOR}"
											></span>
											{typeLabel(entry.type)}
										</span>
									</td>
									<td class="hidden px-4 py-2 md:table-cell">
										<span class="inline-flex items-center gap-1.5">
											<span
												class="inline-block h-2 w-2 rounded-full"
												style="background-color: {entry.accountColor ?? '#94a3b8'}"
											></span>
											{entry.accountName}
										</span>
									</td>
									<td class="hidden px-4 py-2 md:table-cell">
										{periodicityLabel(entry.periodicity)}
									</td>
									<td class="px-3 py-2 text-right font-semibold tabular-nums md:px-4">
										{formatCents(entry.amountCents)}
									</td>
									<td class="hidden px-4 py-2 text-right tabular-nums md:table-cell">
										{formatCents(monthlyLissedCents(entry))}
									</td>
									<td class="hidden px-4 py-2 text-center tabular-nums md:table-cell">
										{entry.day ?? '—'}
									</td>
									<td class="hidden max-w-xs truncate px-4 py-2 text-slate-500 md:table-cell">
										{entry.notes ?? ''}
									</td>
									<td class="px-3 py-2 text-right md:px-4">
										<div class="flex justify-end gap-1">
											<button
												type="button"
												onclick={() => openEditEntry(entry)}
												title={m.entries_action_edit()}
												aria-label={m.entries_action_edit()}
												class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="16"
													height="16"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
													<path d="m15 5 4 4" />
												</svg>
											</button>

											<form
												method="POST"
												action="?/delete"
												use:enhance
												onsubmit={handleDelete}
												class="contents"
											>
												<input type="hidden" name="id" value={entry.id} />
												<button
													type="submit"
													title={m.entries_action_delete()}
													aria-label={m.entries_action_delete()}
													class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														width="16"
														height="16"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
														stroke-linecap="round"
														stroke-linejoin="round"
													>
														<path d="M3 6h18" />
														<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
														<path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
													</svg>
												</button>
											</form>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</section>
		</div>
	{/if}
</div>

<Modal
	open={entryModalOpen}
	title={entryFormTitle}
	onClose={() => (entryModalOpen = false)}
>
	{#key editingEntry?.id ?? 'new'}
		<EntryForm
			accounts={data.accounts}
			initial={entryFormInitial}
			submitLabel={m.action_save()}
			action={entryFormAction}
			onSuccess={() => (entryModalOpen = false)}
			onCancel={() => (entryModalOpen = false)}
			bare
		/>
	{/key}
</Modal>
