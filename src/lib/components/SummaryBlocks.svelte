<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { formatCents } from '$lib/format';
	import {
		contrastText,
		SUBSCRIPTION_COLOR,
		CHARGE_COLOR,
		SAVINGS_COLOR
	} from '$lib/budget-utils';
	import type { Summary, SummaryRow } from '$lib/server/budget';

	let { summary }: { summary: Summary } = $props();

	const TOTAL_LABEL_COLOR = '#4b5563';
	const TOTAL_BG = '#d1d5db';
	const ROW_HEIGHT = '3.5rem';
	const HEADER_HEIGHT = '3rem';

	type Part = { count: number; color: string; label: string };
	type Cell = { value: string; parts?: Part[] | null };

	function cellStyle(bg: string): string {
		return `background-color: ${bg}; color: ${contrastText(bg)};`;
	}

	function breakdownParts(abo: number, charge: number, saving: number): Part[] | null {
		const out: Part[] = [];
		if (abo > 0) out.push({ count: abo, color: SUBSCRIPTION_COLOR, label: m.type_subscription() });
		if (charge > 0) out.push({ count: charge, color: CHARGE_COLOR, label: m.type_charge() });
		if (saving > 0) out.push({ count: saving, color: SAVINGS_COLOR, label: m.type_savings() });
		return out.length === 0 ? null : out;
	}
</script>

{#snippet block(headers: string[], values: (row: SummaryRow) => Cell[])}
	{@const COLS = 6}
	{@const span = COLS / headers.length}
	{@const gridCols = `5rem repeat(${COLS}, 1fr)`}
	<div class="summary-block">
		<!-- Header row (fixed height so all blocks stay aligned regardless of title length) -->
		<div
			class="mb-2 grid gap-1 pb-1 text-xs font-medium tracking-wide text-slate-500 uppercase"
			style="grid-template-columns: {gridCols}; height: {HEADER_HEIGHT};"
		>
			<div></div>
			{#each headers as h (h)}
				<div
					class="flex items-end justify-center text-center leading-tight"
					style="grid-column: span {span};"
				>
					{h}
				</div>
			{/each}
		</div>

		<!-- Total row -->
		<div class="grid items-stretch gap-1" style="grid-template-columns: {gridCols};">
			<div
				class="flex items-center justify-end pr-2 text-xs font-semibold tracking-wide sm:pr-3 sm:text-sm"
				style="color: {TOTAL_LABEL_COLOR}; min-height: {ROW_HEIGHT};"
			>
				{m.dashboard_total_row()}
			</div>
			{#each values(summary.total) as cell, j (j)}
				<div
					class="flex flex-col items-center justify-center rounded-sm px-1 text-sm font-bold tabular-nums leading-tight sm:px-2 sm:text-base"
					style="min-height: {ROW_HEIGHT}; grid-column: span {span}; {cellStyle(TOTAL_BG)}"
				>
					<span>{cell.value}</span>
					{#if cell.parts}
						<span class="mt-0.5 hidden items-center justify-center gap-1.5 text-[11px] font-medium sm:flex">
							{#each cell.parts as p (p.color)}
								<span class="group relative inline-flex items-center gap-1">
									<span class="inline-flex items-center gap-1 opacity-80">
										<span
											class="inline-block h-2 w-2 rounded-full"
											style="background-color: {p.color};"
										></span>
										<span class="tabular-nums">{p.count}</span>
									</span>
									<span
										class="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white shadow-lg group-hover:block"
									>
										{p.label}
									</span>
								</span>
							{/each}
						</span>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Account rows -->
		{#each summary.rows as row (row.accountId)}
			{@const cells = values(row)}
			{@const baseColor = row.accountColor ?? '#94a3b8'}
			<div
				class="mt-1 grid items-stretch gap-1"
				style="grid-template-columns: {gridCols};"
			>
				<div
					class="flex items-center justify-end pr-2 text-xs font-semibold tracking-wide sm:pr-3 sm:text-sm"
					style="color: {baseColor}; min-height: {ROW_HEIGHT};"
				>
					{row.accountName}
				</div>
				{#each cells as cell, j (j)}
					<div
						class="flex flex-col items-center justify-center rounded-sm px-1 text-xs font-semibold tabular-nums leading-tight sm:px-2 sm:text-sm"
						style="min-height: {ROW_HEIGHT}; grid-column: span {span}; {cellStyle(baseColor)}"
					>
						<span>{cell.value}</span>
						{#if cell.parts}
							<span class="mt-0.5 hidden items-center justify-center gap-1.5 text-[11px] font-medium sm:flex">
								{#each cell.parts as p (p.color)}
									<span class="group relative inline-flex items-center gap-1">
										<span class="inline-flex items-center gap-1 opacity-80">
											<span
												class="inline-block h-2 w-2 rounded-full"
												style="background-color: {p.color};"
											></span>
											<span class="tabular-nums">{p.count}</span>
										</span>
										<span
											class="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white shadow-lg group-hover:block"
										>
											{p.label}
										</span>
									</span>
								{/each}
							</span>
						{/if}
					</div>
				{/each}
			</div>
		{/each}
	</div>
{/snippet}

<div class="grid gap-4 sm:gap-8 xl:grid-cols-[2fr_3fr_2fr]">
	{@render block(
		[
			m.dashboard_column_subscriptions(),
			m.dashboard_column_charges(),
			m.dashboard_column_savings()
		],
		(row) => [
			{ value: String(row.counts.abonnement) },
			{ value: String(row.counts.charge) },
			{ value: String(row.counts.epargne) }
		]
	)}

	{@render block(
		[
			m.dashboard_column_monthly_sum(),
			m.dashboard_column_quarterly_sum(),
			m.dashboard_column_yearly_sum()
		],
		(row) => [
			{
				value: formatCents(row.rawCents.monthly),
				parts: breakdownParts(
					row.countsByPeriodicityByType.abonnement.monthly,
					row.countsByPeriodicityByType.charge.monthly,
					row.countsByPeriodicityByType.epargne.monthly
				)
			},
			{
				value: formatCents(row.rawCents.quarterly),
				parts: breakdownParts(
					row.countsByPeriodicityByType.abonnement.quarterly,
					row.countsByPeriodicityByType.charge.quarterly,
					row.countsByPeriodicityByType.epargne.quarterly
				)
			},
			{
				value: formatCents(row.rawCents.yearly),
				parts: breakdownParts(
					row.countsByPeriodicityByType.abonnement.yearly,
					row.countsByPeriodicityByType.charge.yearly,
					row.countsByPeriodicityByType.epargne.yearly
				)
			}
		]
	)}

	{@render block(
		[m.dashboard_column_yearly_total(), m.dashboard_column_monthly_total()],
		(row) => [
			{ value: formatCents(row.totalsCents.yearly) },
			{ value: formatCents(row.totalsCents.monthly) }
		]
	)}
</div>
