<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { locales } from '$lib/paraglide/runtime';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';

	let { data, form } = $props();

	const errorMessage = $derived(
		form?.error === 'current_password'
			? m.settings_error_current_password()
			: form?.error === 'mismatch'
				? m.reset_error_mismatch()
				: form?.error === 'short'
					? m.reset_error_short()
					: form?.error === 'required'
						? m.validation_required()
						: null
	);

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

	const editing = $derived(data.editing);
	const accountRaw = $derived(
		form && 'raw' in form ? ((form.raw as Record<string, unknown> | null) ?? null) : null
	);

	const initial = $derived({
		id: editing?.id ?? null,
		name: ((accountRaw?.name as string | null) ?? editing?.name ?? '') as string,
		color: ((accountRaw?.color as string | null) ?? editing?.color ?? COLOR_PALETTE[0]) as string,
		position: ((accountRaw?.position as string | null) ??
			String(editing?.position ?? 0)) as string
	});

	let selectedColor = $state(COLOR_PALETTE[0]);
	$effect(() => {
		selectedColor = initial.color;
	});

	const swatches = $derived(
		COLOR_PALETTE.includes(selectedColor.toLowerCase())
			? COLOR_PALETTE
			: [selectedColor, ...COLOR_PALETTE]
	);

	const accountErrors = $derived(
		form && 'errors' in form ? ((form.errors as Record<string, boolean> | null) ?? null) : null
	);
	const deleteError = $derived(
		form && 'deleteError' in form ? form.deleteError === 'has_entries' : false
	);

	function handleDeleteAccount(e: SubmitEvent) {
		if (!confirm(m.accounts_confirm_delete())) e.preventDefault();
	}

	type Tab = 'accounts' | 'preferences' | 'credentials';
	const tabs: { id: Tab; label: () => string }[] = [
		{ id: 'accounts', label: () => m.accounts_title() },
		{ id: 'preferences', label: () => m.settings_preferences() },
		{ id: 'credentials', label: () => m.settings_credentials_title() }
	];

	function pickInitialTab(): Tab {
		const fromUrl = page.url.searchParams.get('tab');
		if (fromUrl === 'accounts' || fromUrl === 'preferences' || fromUrl === 'credentials') {
			return fromUrl;
		}
		if (page.url.searchParams.get('edit')) return 'accounts';
		if (form && ('error' in form || 'saved' in form)) return 'credentials';
		if (form && ('errors' in form || 'deleteError' in form || 'raw' in form)) return 'accounts';
		if (form && 'currencyError' in form) return 'preferences';
		if (form && 'localeError' in form) return 'preferences';
		return 'accounts';
	}

	let activeTab = $state<Tab>(pickInitialTab());

	const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY'] as const;
	let currencyForm = $state<HTMLFormElement | null>(null);
	let languageForm = $state<HTMLFormElement | null>(null);
</script>

<svelte:head><title>{m.settings_title()} · {m.app_name()}</title></svelte:head>

<div class="mx-auto max-w-4xl space-y-6">
	<h1 class="text-2xl font-semibold text-slate-900">{m.settings_title()}</h1>

	<div class="border-b border-slate-200">
		<nav class="-mb-px flex gap-1">
			{#each tabs as tab (tab.id)}
				{@const isActive = activeTab === tab.id}
				<button
					type="button"
					onclick={() => (activeTab = tab.id)}
					class="cursor-pointer border-b-2 px-4 py-2 text-sm font-medium transition-colors {isActive
						? 'border-slate-900 text-slate-900'
						: 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'}"
				>
					{tab.label()}
				</button>
			{/each}
		</nav>
	</div>

	{#if activeTab === 'accounts'}
		<section class="space-y-3">
			{#if deleteError}
				<div class="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
					{m.accounts_delete_blocked()}
				</div>
			{/if}

			<div class="grid gap-6 lg:grid-cols-[2fr_1fr]">
				<div class="space-y-3">
					{#if data.accounts.length === 0}
						<div
							class="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500"
						>
							{m.accounts_empty()}
						</div>
					{:else}
						<div class="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
							<table class="min-w-full text-sm">
								<thead class="bg-slate-50 text-slate-600">
									<tr class="text-left">
										<th class="px-3 py-2 font-medium">{m.accounts_column_name()}</th>
										<th class="px-3 py-2 text-center font-medium"
											>{m.accounts_column_position()}</th
										>
										<th class="px-3 py-2 text-right font-medium"
											>{m.accounts_column_entries()}</th
										>
										<th class="px-3 py-2 text-right font-medium"
											>{m.accounts_column_actions()}</th
										>
									</tr>
								</thead>
								<tbody class="divide-y divide-slate-100">
									{#each data.accounts as a (a.id)}
										<tr>
											<td class="px-3 py-2 font-medium">
												<span class="inline-flex items-center gap-2">
													<span
														class="inline-block h-2.5 w-2.5 rounded-full"
														style="background-color: {a.color}"
													></span>
													{a.name}
												</span>
											</td>
											<td class="px-3 py-2 text-center tabular-nums">{a.position}</td>
											<td class="px-3 py-2 text-right tabular-nums">{a.entriesCount}</td>
											<td class="px-3 py-2 text-right">
												<div class="flex justify-end gap-1">
													<a
														href={`/settings?edit=${a.id}`}
														title={m.action_edit()}
														aria-label={m.action_edit()}
														class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
													>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															width="16"
															height="16"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															stroke-width="2"
															stroke-linecap="round"
															stroke-linejoin="round"
														>
															<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
															<path d="m15 5 4 4" />
														</svg>
													</a>
													<form
														method="POST"
														action="?/deleteAccount"
														use:enhance
														onsubmit={handleDeleteAccount}
														class="contents"
													>
														<input type="hidden" name="id" value={a.id} />
														<button
															type="submit"
															title={m.action_delete()}
															aria-label={m.action_delete()}
															class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
														>
															<svg
																xmlns="http://www.w3.org/2000/svg"
																width="16"
																height="16"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																stroke-width="2"
																stroke-linecap="round"
																stroke-linejoin="round"
															>
																<path d="M3 6h18" />
																<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
																<path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
															</svg>
														</button>
													</form>
												</div>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>

				<aside class="space-y-3">
					<h3 class="text-sm font-medium text-slate-700">
						{editing ? m.accounts_form_edit_title() : m.accounts_form_new_title()}
					</h3>
					<form
						method="POST"
						action="?/saveAccount"
						use:enhance
						class="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
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
							{#if accountErrors?.name}
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
										style="background-color: {swatch}; border-color: {active
											? '#0f172a'
											: 'transparent'};"
									></button>
								{/each}
							</div>
							{#if accountErrors?.color}
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

						<div class="flex justify-end gap-2">
							{#if editing}
								<a
									href="/settings"
									class="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
								>
									{m.action_cancel()}
								</a>
							{/if}
							<button
								type="submit"
								class="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
							>
								{m.action_save()}
							</button>
						</div>
					</form>
				</aside>
			</div>
		</section>
	{:else if activeTab === 'preferences'}
		<section class="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
			<form method="POST" action="?/language" use:enhance bind:this={languageForm} class="space-y-2">
				<label class="block space-y-1 text-sm">
					<span class="font-medium text-slate-700">{m.settings_language()}</span>
					<select
						name="locale"
						value={data.locale}
						onchange={() => languageForm?.requestSubmit()}
						class="block w-48 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
					>
						{#each locales as locale (locale)}
							<option value={locale}>
								{locale === 'fr' ? m.settings_language_fr() : m.settings_language_en()}
							</option>
						{/each}
					</select>
				</label>
			</form>

			<form method="POST" action="?/currency" use:enhance bind:this={currencyForm} class="space-y-2">
				<label class="block space-y-1 text-sm">
					<span class="font-medium text-slate-700">{m.settings_currency()}</span>
					<select
						name="currency"
						value={data.currency}
						onchange={() => currencyForm?.requestSubmit()}
						class="block w-48 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
					>
						{#each CURRENCIES as code (code)}
							<option value={code}>{code}</option>
						{/each}
					</select>
				</label>
			</form>
		</section>
	{:else if activeTab === 'credentials'}
		<section class="space-y-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
			<form method="POST" action="?/credentials" use:enhance class="space-y-4">
				<div class="space-y-1 text-sm">
					<span class="font-medium text-slate-700">{m.settings_credentials_login()}</span>
					<p class="font-mono text-sm text-slate-500">{data.login}</p>
				</div>

				<label class="block space-y-1 text-sm">
					<span class="font-medium text-slate-700"
						>{m.settings_credentials_current_password()}</span
					>
					<input
						name="currentPassword"
						type="password"
						autocomplete="current-password"
						required
						class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
					/>
				</label>

				<label class="block space-y-1 text-sm">
					<span class="font-medium text-slate-700">{m.reset_new_login()}</span>
					<input
						name="newLogin"
						type="text"
						autocomplete="username"
						required
						value={(form && 'newLogin' in form ? (form.newLogin as string) : null) ?? data.login}
						class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
					/>
				</label>

				<label class="block space-y-1 text-sm">
					<span class="font-medium text-slate-700">{m.settings_credentials_new_password()}</span>
					<input
						name="newPassword"
						type="password"
						autocomplete="new-password"
						required
						minlength="8"
						class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
					/>
				</label>

				<label class="block space-y-1 text-sm">
					<span class="font-medium text-slate-700"
						>{m.settings_credentials_confirm_password()}</span
					>
					<input
						name="confirmPassword"
						type="password"
						autocomplete="new-password"
						required
						minlength="8"
						class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
					/>
				</label>

				{#if errorMessage}
					<p class="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p>
				{/if}

				{#if form && 'saved' in form && form.saved}
					<p class="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
						{m.settings_saved()}
					</p>
				{/if}

				<div class="flex justify-end">
					<button
						type="submit"
						class="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
					>
						{m.action_save()}
					</button>
				</div>
			</form>
		</section>
	{/if}
</div>
