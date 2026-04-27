<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	type AccountInit = {
		id: number | null;
		name: string;
		color: string;
		position: string;
	};

	let {
		initial,
		errors,
		action = '?/saveAccount',
		onSuccess,
		onCancel
	}: {
		initial: AccountInit;
		errors?: Record<string, boolean> | null;
		action?: string;
		onSuccess?: () => void;
		onCancel?: () => void;
	} = $props();

	const COLOR_PALETTE = [
		'#f6aace',
		'#f8b88c',
		'#f5d182',
		'#cee2a0',
		'#a8d8b9',
		'#a2d4e5',
		'#b3c7e8',
		'#c9b3e8'
	];

	// svelte-ignore state_referenced_locally
	let selectedColor = $state(initial.color || COLOR_PALETTE[0]);

	const swatches = $derived(
		COLOR_PALETTE.includes(selectedColor.toLowerCase())
			? COLOR_PALETTE
			: [selectedColor, ...COLOR_PALETTE]
	);
</script>

<form
	method="POST"
	{action}
	use:enhance={() => {
		return async ({ result, update }) => {
			if (onSuccess && (result.type === 'redirect' || result.type === 'success')) {
				onSuccess();
				await invalidateAll();
			} else {
				await update();
			}
		};
	}}
	class="space-y-4"
>
	{#if initial.id}
		<input type="hidden" name="id" value={initial.id} />
	{/if}

	<label class="block space-y-1 text-sm">
		<span class="font-medium text-slate-700">{m.accounts_form_name()}</span>
		<input
			name="name"
			type="text"
			required
			value={initial.name}
			class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
		/>
		{#if errors?.name}
			<span class="text-xs text-rose-600">{m.validation_required()}</span>
		{/if}
	</label>

	<div class="space-y-1.5 text-sm">
		<span class="font-medium text-slate-700">{m.accounts_form_color()}</span>
		<input type="hidden" name="color" value={selectedColor} />
		<div class="flex flex-wrap gap-2">
			{#each swatches as swatch (swatch)}
				{@const active = selectedColor.toLowerCase() === swatch.toLowerCase()}
				<button
					type="button"
					onclick={() => (selectedColor = swatch)}
					title={swatch}
					aria-label={swatch}
					class="h-8 w-8 cursor-pointer rounded-full border-2 transition hover:scale-110"
					style="background-color: {swatch}; border-color: {active ? '#0f172a' : 'transparent'};"
				></button>
			{/each}
		</div>
		{#if errors?.color}
			<span class="text-xs text-rose-600">{m.validation_hex_color()}</span>
		{/if}
	</div>

	<label class="block space-y-1 text-sm">
		<span class="font-medium text-slate-700">{m.accounts_form_position()}</span>
		<input
			name="position"
			type="number"
			min="0"
			value={initial.position}
			class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm tabular-nums"
		/>
	</label>

	<div class="flex justify-end gap-2 border-t border-slate-200 pt-4">
		{#if onCancel}
			<button
				type="button"
				onclick={() => onCancel?.()}
				class="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
			>
				{m.action_cancel()}
			</button>
		{/if}
		<button
			type="submit"
			class="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
		>
			{m.action_save()}
		</button>
	</div>
</form>
