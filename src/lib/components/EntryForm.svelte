<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { enhance } from '$app/forms';
	import { contrastText, SUBSCRIPTION_COLOR, CHARGE_COLOR } from '$lib/budget-utils';

	type AccountOption = { id: number; name: string; color: string };

	type EntryInit = {
		label: string;
		type: 'abonnement' | 'charge';
		accountId: number | null;
		periodicity: 'mensuel' | 'trimestriel' | 'annuel';
		amount: string;
		day: string;
		notes: string;
		isActive: boolean;
	};

	let {
		accounts,
		initial,
		errors,
		submitLabel,
		cancelHref
	}: {
		accounts: AccountOption[];
		initial: EntryInit;
		errors?: Record<string, string>;
		submitLabel: string;
		cancelHref: string;
	} = $props();

	// svelte-ignore state_referenced_locally
	let selectedType = $state<'abonnement' | 'charge'>(initial.type);
	// svelte-ignore state_referenced_locally
	let selectedAccountId = $state<number | null>(initial.accountId);
	// svelte-ignore state_referenced_locally
	let selectedPeriodicity = $state<'mensuel' | 'trimestriel' | 'annuel'>(initial.periodicity);

	const typeOptions: Array<{ value: 'abonnement' | 'charge'; label: string; color: string }> = [
		{ value: 'abonnement', label: m.type_subscription(), color: SUBSCRIPTION_COLOR },
		{ value: 'charge', label: m.type_charge(), color: CHARGE_COLOR }
	];

	const periodicityOptions: Array<{
		value: 'mensuel' | 'trimestriel' | 'annuel';
		label: string;
	}> = [
		{ value: 'mensuel', label: m.periodicity_monthly() },
		{ value: 'trimestriel', label: m.periodicity_quarterly() },
		{ value: 'annuel', label: m.periodicity_yearly() }
	];

	const PILL_BASE =
		'cursor-pointer rounded-full border border-transparent px-3 py-1.5 text-xs font-semibold transition hover:brightness-95';
	const PILL_INACTIVE = 'background-color: #f1f5f9; color: #94a3b8;';
</script>

<form
	method="POST"
	use:enhance
	class="space-y-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
>
	<input type="hidden" name="type" value={selectedType} />
	<input type="hidden" name="accountId" value={selectedAccountId ?? ''} />
	<input type="hidden" name="periodicity" value={selectedPeriodicity} />

	<div class="grid gap-4 md:grid-cols-2">
		<label class="block space-y-1 text-sm">
			<span class="font-medium text-slate-700">{m.entries_form_label()}</span>
			<input
				name="label"
				type="text"
				required
				value={initial.label}
				class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
			/>
			{#if errors?.label}
				<span class="text-xs text-rose-600">{m.validation_required()}</span>
			{/if}
		</label>

		<label class="block space-y-1 text-sm">
			<span class="font-medium text-slate-700">{m.entries_form_amount()}</span>
			<input
				name="amount"
				type="text"
				inputmode="decimal"
				required
				value={initial.amount}
				placeholder="0.00"
				class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm tabular-nums"
			/>
			{#if errors?.amount}
				<span class="text-xs text-rose-600">{m.validation_positive()}</span>
			{/if}
		</label>
	</div>

	<div class="space-y-1.5 text-sm">
		<span class="font-medium text-slate-700">{m.entries_form_type()}</span>
		<div class="flex flex-wrap gap-2">
			{#each typeOptions as opt (opt.value)}
				{@const active = selectedType === opt.value}
				<button
					type="button"
					onclick={() => (selectedType = opt.value)}
					class={PILL_BASE}
					style={active
						? `background-color: ${opt.color}; color: ${contrastText(opt.color)};`
						: PILL_INACTIVE}
				>
					{opt.label}
				</button>
			{/each}
		</div>
	</div>

	<div class="space-y-1.5 text-sm">
		<span class="font-medium text-slate-700">{m.entries_form_account()}</span>
		<div class="flex flex-wrap gap-2">
			{#each accounts as a (a.id)}
				{@const active = selectedAccountId === a.id}
				<button
					type="button"
					onclick={() => (selectedAccountId = a.id)}
					class={PILL_BASE}
					style={active
						? `background-color: ${a.color}; color: ${contrastText(a.color)};`
						: PILL_INACTIVE}
				>
					{a.name}
				</button>
			{/each}
		</div>
		{#if errors?.accountId}
			<span class="text-xs text-rose-600">{m.validation_required()}</span>
		{/if}
	</div>

	<div class="grid gap-4 md:grid-cols-2">
		<div class="space-y-1.5 text-sm">
			<span class="font-medium text-slate-700">{m.entries_form_periodicity()}</span>
			<div class="flex flex-wrap gap-2">
				{#each periodicityOptions as opt (opt.value)}
					{@const active = selectedPeriodicity === opt.value}
					<button
						type="button"
						onclick={() => (selectedPeriodicity = opt.value)}
						class={PILL_BASE}
						style={active ? 'background-color: #475569; color: #ffffff;' : PILL_INACTIVE}
					>
						{opt.label}
					</button>
				{/each}
			</div>
		</div>

		<label class="block space-y-1 text-sm">
			<span class="font-medium text-slate-700">{m.entries_form_day()}</span>
			<input
				name="day"
				type="number"
				min="1"
				max="31"
				value={initial.day}
				class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm tabular-nums"
			/>
			{#if errors?.day}
				<span class="text-xs text-rose-600">{m.validation_day_range()}</span>
			{/if}
		</label>
	</div>

	<label class="block space-y-1 text-sm">
		<span class="font-medium text-slate-700">{m.entries_form_notes()}</span>
		<textarea
			name="notes"
			rows="2"
			class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
			>{initial.notes}</textarea
		>
	</label>

	<label class="flex items-center gap-2 text-sm">
		<input
			type="checkbox"
			name="isActive"
			checked={initial.isActive}
			class="rounded border-slate-300"
		/>
		<span class="font-medium text-slate-700">{m.entries_form_is_active()}</span>
	</label>

	<div class="flex justify-end gap-2 border-t border-slate-200 pt-4">
		<a
			href={cancelHref}
			class="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
		>
			{m.action_cancel()}
		</a>
		<button
			type="submit"
			class="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
		>
			{submitLabel}
		</button>
	</div>
</form>
