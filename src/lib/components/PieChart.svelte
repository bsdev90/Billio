<script lang="ts">
	import { onDestroy } from 'svelte';
	import Chart from 'chart.js/auto';
	import { formatCents } from '$lib/format';

	type Slice = { label: string; value: number; color?: string | null };

	let { slices, title }: { slices: Slice[]; title?: string } = $props();

	let canvas: HTMLCanvasElement | undefined = $state();
	let chart: Chart | undefined;

	$effect(() => {
		if (!canvas) return;
		const labels = slices.map((s) => s.label);
		const data = slices.map((s) => s.value / 100);
		const colors = slices.map((s, i) => s.color ?? defaultColor(i));

		if (chart) {
			chart.data.labels = labels;
			chart.data.datasets[0].data = data;
			chart.data.datasets[0].backgroundColor = colors;
			chart.update();
		} else {
			chart = new Chart(canvas, {
				type: 'pie',
				data: {
					labels,
					datasets: [{ data, backgroundColor: colors, borderWidth: 1, borderColor: '#ffffff' }]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: { position: 'bottom' },
						tooltip: {
							callbacks: {
								label: (ctx) => `${ctx.label}: ${formatCents((ctx.parsed as number) * 100)}`
							}
						}
					}
				}
			});
		}
	});

	onDestroy(() => chart?.destroy());

	function defaultColor(i: number): string {
		const palette = ['#94a3b8', '#2B8EB6', '#e11d74', '#22c55e', '#f59e0b', '#a855f7'];
		return palette[i % palette.length];
	}
</script>

<div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
	{#if title}
		<h3 class="mb-3 text-sm font-medium text-slate-600">{title}</h3>
	{/if}
	<div class="relative h-64">
		<canvas bind:this={canvas}></canvas>
	</div>
</div>
