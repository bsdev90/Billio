<script lang="ts">
	import { formatCents } from '$lib/format';
	import { m } from '$lib/paraglide/messages.js';
	import { SUBSCRIPTION_COLOR, CHARGE_COLOR, SAVINGS_COLOR, contrastText } from '$lib/budget-utils';

	type Group = {
		label: string;
		abonnementCents: number;
		chargeCents: number;
		epargneCents: number;
	};

	let { groups, title }: { groups: Group[]; title?: string } = $props();

	const subText = contrastText(SUBSCRIPTION_COLOR);
	const chargeText = contrastText(CHARGE_COLOR);
	const savingsText = contrastText(SAVINGS_COLOR);
</script>

<div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
	{#if title}
		<h3 class="mb-3 text-sm font-medium text-slate-600">{title}</h3>
	{/if}

	<div class="space-y-3">
		{#each groups as g (g.label)}
			{@const total = g.abonnementCents + g.chargeCents + g.epargneCents}
			{@const subPct = total === 0 ? 0 : (g.abonnementCents / total) * 100}
			{@const chargePct = total === 0 ? 0 : (g.chargeCents / total) * 100}
			{@const savingsPct = total === 0 ? 0 : (g.epargneCents / total) * 100}
			<div>
				<div class="mb-1 flex items-baseline justify-between text-xs">
					<span class="font-medium text-slate-700">{g.label}</span>
					<span class="tabular-nums text-slate-400">{formatCents(total)}</span>
				</div>
				<div class="flex h-6 w-full overflow-hidden rounded-md bg-slate-100">
					{#if subPct > 0}
						<div
							class="flex items-center justify-center text-xs font-semibold tabular-nums"
							style="width: {subPct}%; background-color: {SUBSCRIPTION_COLOR}; color: {subText};"
							title="{m.type_subscription()}: {formatCents(g.abonnementCents)} ({Math.round(
								subPct
							)}%)"
						>
							{#if subPct >= 12}{Math.round(subPct)}%{/if}
						</div>
					{/if}
					{#if chargePct > 0}
						<div
							class="flex items-center justify-center text-xs font-semibold tabular-nums"
							style="width: {chargePct}%; background-color: {CHARGE_COLOR}; color: {chargeText};"
							title="{m.type_charge()}: {formatCents(g.chargeCents)} ({Math.round(chargePct)}%)"
						>
							{#if chargePct >= 12}{Math.round(chargePct)}%{/if}
						</div>
					{/if}
					{#if savingsPct > 0}
						<div
							class="flex items-center justify-center text-xs font-semibold tabular-nums"
							style="width: {savingsPct}%; background-color: {SAVINGS_COLOR}; color: {savingsText};"
							title="{m.type_savings()}: {formatCents(g.epargneCents)} ({Math.round(savingsPct)}%)"
						>
							{#if savingsPct >= 12}{Math.round(savingsPct)}%{/if}
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<div class="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
		<span class="inline-flex items-center gap-1.5">
			<span
				class="inline-block h-2 w-2 rounded-full"
				style="background-color: {SUBSCRIPTION_COLOR}"
			></span>
			{m.type_subscription()}
		</span>
		<span class="inline-flex items-center gap-1.5">
			<span class="inline-block h-2 w-2 rounded-full" style="background-color: {CHARGE_COLOR}"
			></span>
			{m.type_charge()}
		</span>
		<span class="inline-flex items-center gap-1.5">
			<span class="inline-block h-2 w-2 rounded-full" style="background-color: {SAVINGS_COLOR}"
			></span>
			{m.type_savings()}
		</span>
	</div>
</div>
