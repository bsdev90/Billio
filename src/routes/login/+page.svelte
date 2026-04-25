<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head><title>{m.login_title()} · {m.app_name()}</title></svelte:head>

<div class="flex min-h-screen items-center justify-center bg-slate-50 p-4">
	<form
		method="POST"
		class="w-full max-w-sm space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
	>
		<div class="space-y-2 text-center">
			<img src="/logo.png" alt="" class="mx-auto h-32 w-32" />
			<h1 class="text-xl font-semibold text-slate-900">{m.app_name()}</h1>
			<p class="text-sm text-slate-500">{m.app_tagline()}</p>
		</div>

		<div class="space-y-2">
			<label class="block text-sm font-medium text-slate-700" for="login">
				{m.login_field_login()}
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
				{m.login_field_password()}
			</label>
			<input
				id="password"
				name="password"
				type="password"
				autocomplete="current-password"
				required
				class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none"
			/>
		</div>

		{#if form?.error}
			<p class="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
				{m.login_error()}
			</p>
		{/if}

		<button
			type="submit"
			class="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:ring-2 focus:ring-slate-500 focus:outline-none"
		>
			{m.login_submit()}
		</button>
	</form>
</div>
