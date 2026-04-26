<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { formatCents } from '$lib/format';
	import { contrastText } from '$lib/budget-utils';
	import type { Summary, SummaryRow } from '$lib/server/budget';

	let { summary }: { summary: Summary } = $props();

	const TOTAL_LABEL_COLOR = '#4b5563';
	const TOTAL_BG = '#d1d5db';
	const ROW_HEIGHT = '3.5rem';
	const HEADER_HEIGHT = '3rem';

	type Cell = { value: string; subLabel?: string | null };

	function cellStyle(bg: string): string {
		return `background-color: ${bg}; color: ${contrastText(bg)};`;
	}

	function aboLabel(count: number): string {
		return count === 1 ? m.one_sub() : m.n_subs({ count: String(count) });
	}

	function chargeLabel(count: number): string {
		return count === 1 ? m.one_charge() : m.n_charges({ count: String(count) });
	}

	function breakdownLabel(abo: number, charge: number): string | null {
		if (abo <= 0 && charge <= 0) return null;
		if (abo > 0 && charge > 0) return `${aboLabel(abo)} · ${chargeLabel(charge)}`;
		return abo > 0 ? aboLabel(abo) : chargeLabel(charge);
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
					{#if cell.subLabel}
						<span class="mt-0.5 hidden text-[10px] font-medium opacity-70 sm:block"
							>{cell.subLabel}</span
						>
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
						{#if cell.subLabel}
							<span class="mt-0.5 hidden text-[10px] font-medium opacity-70 sm:block"
								>{cell.subLabel}</span
							>
						{/if}
					</div>
				{/each}
			</div>
		{/each}
	</div>
{/snippet}

<div class="grid gap-4 sm:gap-8 xl:grid-cols-[2fr_3fr_2fr]">
	{@render block(
		[m.dashboard_column_subscriptions(), m.dashboard_column_charges()],
		(row) => [{ value: String(row.counts.abonnement) }, { value: String(row.counts.charge) }]
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
				subLabel: breakdownLabel(
					row.countsByPeriodicityByType.abonnement.monthly,
					row.countsByPeriodicityByType.charge.monthly
				)
			},
			{
				value: formatCents(row.rawCents.quarterly),
				subLabel: breakdownLabel(
					row.countsByPeriodicityByType.abonnement.quarterly,
					row.countsByPeriodicityByType.charge.quarterly
				)
			},
			{
				value: formatCents(row.rawCents.yearly),
				subLabel: breakdownLabel(
					row.countsByPeriodicityByType.abonnement.yearly,
					row.countsByPeriodicityByType.charge.yearly
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
