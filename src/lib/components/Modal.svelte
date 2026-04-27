<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open,
		title,
		onClose,
		children
	}: {
		open: boolean;
		title: string;
		onClose: () => void;
		children: Snippet;
	} = $props();
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
		role="presentation"
		onclick={(e) => {
			if (e.target === e.currentTarget) onClose();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') onClose();
		}}
	>
		<div
			class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-lg"
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
		>
			<div class="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
				<h2 id="modal-title" class="text-lg font-semibold text-slate-900">{title}</h2>
				<button
					type="button"
					onclick={onClose}
					aria-label="Close"
					class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M18 6 6 18" />
						<path d="m6 6 12 12" />
					</svg>
				</button>
			</div>
			<div class="p-4 sm:p-6">
				{@render children()}
			</div>
		</div>
	</div>
{/if}
