<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { formatCents } from '$lib/format';
	import type { Summary } from '$lib/server/budget';

	let { summary }: { summary: Summary } = $props();
</script>

<div class="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
	<table class="min-w-full text-sm">
		<thead class="bg-slate-50 text-slate-600">
			<tr class="text-left">
				<th class="px-4 py-3 font-medium">{m.dashboard_column_account()}</th>
				<th class="px-4 py-3 text-right font-medium">{m.dashboard_column_subscriptions()}</th>
				<th class="px-4 py-3 text-right font-medium">{m.dashboard_column_charges()}</th>
				<th class="px-4 py-3 text-right font-medium">{m.dashboard_column_monthly_sum()}</th>
				<th class="px-4 py-3 text-right font-medium">{m.dashboard_column_quarterly_sum()}</th>
				<th class="px-4 py-3 text-right font-medium">{m.dashboard_column_yearly_sum()}</th>
				<th class="px-4 py-3 text-right font-medium">{m.dashboard_column_monthly_total()}</th>
				<th class="px-4 py-3 text-right font-medium">{m.dashboard_column_yearly_total()}</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-slate-100">
			{#each summary.rows as row (row.accountId)}
				<tr>
					<td class="px-4 py-3 font-medium">
						<span class="inline-flex items-center gap-2">
							<span
								class="inline-block h-2.5 w-2.5 rounded-full"
								style="background-color: {row.accountColor ?? '#94a3b8'}"
							></span>
							{row.accountName}
						</span>
					</td>
					<td class="px-4 py-3 text-right tabular-nums">{row.counts.abonnement}</td>
					<td class="px-4 py-3 text-right tabular-nums">{row.counts.charge}</td>
					<td class="px-4 py-3 text-right tabular-nums">{formatCents(row.rawCents.monthly)}</td>
					<td class="px-4 py-3 text-right tabular-nums">{formatCents(row.rawCents.quarterly)}</td>
					<td class="px-4 py-3 text-right tabular-nums">{formatCents(row.rawCents.yearly)}</td>
					<td class="px-4 py-3 text-right font-medium tabular-nums">{formatCents(row.totalsCents.monthly)}</td>
					<td class="px-4 py-3 text-right font-medium tabular-nums">{formatCents(row.totalsCents.yearly)}</td>
				</tr>
			{/each}
		</tbody>
		<tfoot class="bg-slate-100 font-semibold text-slate-900">
			<tr>
				<td class="px-4 py-3">{m.dashboard_total_row()}</td>
				<td class="px-4 py-3 text-right tabular-nums">{summary.total.counts.abonnement}</td>
				<td class="px-4 py-3 text-right tabular-nums">{summary.total.counts.charge}</td>
				<td class="px-4 py-3 text-right tabular-nums">{formatCents(summary.total.rawCents.monthly)}</td>
				<td class="px-4 py-3 text-right tabular-nums">{formatCents(summary.total.rawCents.quarterly)}</td>
				<td class="px-4 py-3 text-right tabular-nums">{formatCents(summary.total.rawCents.yearly)}</td>
				<td class="px-4 py-3 text-right tabular-nums">{formatCents(summary.total.totalsCents.monthly)}</td>
				<td class="px-4 py-3 text-right tabular-nums">{formatCents(summary.total.totalsCents.yearly)}</td>
			</tr>
		</tfoot>
	</table>
</div>
