<script lang="ts">
	import { onDestroy } from 'svelte';
	import Chart from 'chart.js/auto';
	import { formatCents } from '$lib/format';

	type Slice = { label: string; value: number; color: string };

	let { slices, title }: { slices: Slice[]; title?: string } = $props();

	let canvas: HTMLCanvasElement | undefined = $state();
	let chart: Chart | undefined;

	$effect(() => {
		if (!canvas) return;
		const total = slices.reduce((acc, s) => acc + s.value, 0);
		const labels = slices.map((s) => {
			const pct = total === 0 ? 0 : Math.round((s.value / total) * 100);
			return `${s.label} : ${pct}% (${formatCents(s.value)})`;
		});
		const data = slices.map((s) => s.value / 100);
		const colors = slices.map((s) => s.color);

		if (chart) {
			chart.data.labels = labels;
			chart.data.datasets[0].data = data;
			chart.data.datasets[0].backgroundColor = colors;
			chart.update();
		} else {
			chart = new Chart(canvas, {
				type: 'doughnut',
				data: {
					labels,
					datasets: [{ data, backgroundColor: colors, borderWidth: 1, borderColor: '#ffffff' }]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					cutout: '65%',
					plugins: {
						legend: { position: 'bottom' },
						tooltip: {
							callbacks: {
								label: (ctx) => `${ctx.label}`
							}
						}
					}
				}
			});
		}
	});

	onDestroy(() => chart?.destroy());
</script>

<div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
	{#if title}
		<h3 class="mb-3 text-sm font-medium text-slate-600">{title}</h3>
	{/if}
	<div class="relative h-64">
		<canvas bind:this={canvas}></canvas>
	</div>
</div>
