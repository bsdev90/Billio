<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	const errorMessage = $derived(
		form?.error === 'mismatch'
			? m.reset_error_mismatch()
			: form?.error === 'short'
				? m.reset_error_short()
				: null
	);
</script>

<svelte:head><title>{m.reset_title()} · {m.app_name()}</title></svelte:head>

<div class="flex min-h-screen items-center justify-center bg-slate-50 p-4">
	<form
		method="POST"
		class="w-full max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
	>
		<div class="space-y-1">
			<h1 class="text-xl font-semibold text-slate-900">{m.reset_title()}</h1>
			<p class="text-sm text-slate-500">{m.reset_description()}</p>
		</div>

		<div class="space-y-2">
			<label class="block text-sm font-medium text-slate-700" for="login">
				{m.reset_new_login()}
			</label>
			<input
				id="login"
				name="login"
				type="text"
				autocomplete="username"
				required
				value={form?.login ?? ''}
				class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none"
			/>
		</div>

		<div class="space-y-2">
			<label class="block text-sm font-medium text-slate-700" for="password">
				{m.reset_new_password()}
			</label>
			<input
				id="password"
				name="password"
				type="password"
				autocomplete="new-password"
				required
				minlength="8"
				class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none"
			/>
		</div>

		<div class="space-y-2">
			<label class="block text-sm font-medium text-slate-700" for="confirm">
				{m.reset_confirm_password()}
			</label>
			<input
				id="confirm"
				name="confirm"
				type="password"
				autocomplete="new-password"
				required
				minlength="8"
				class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none"
			/>
		</div>

		{#if errorMessage}
			<p class="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p>
		{/if}

		<button
			type="submit"
			class="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:ring-2 focus:ring-slate-500 focus:outline-none"
		>
			{m.reset_submit()}
		</button>
	</form>
</div>
