<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { locales } from '$lib/paraglide/runtime';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';

	let { data, form } = $props();

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
		form && 'raw' in form && form.raw && !('isAdmin' in (form.raw as object))
			? ((form.raw as Record<string, unknown> | null) ?? null)
			: null
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
		form && 'errors' in form
			? ((form.errors as unknown as Record<string, boolean> | null) ?? null)
			: null
	);
	const deleteError = $derived(
		form && 'deleteError' in form ? form.deleteError === 'has_entries' : false
	);

	function handleDeleteAccount(e: SubmitEvent) {
		if (!confirm(m.accounts_confirm_delete())) e.preventDefault();
	}

	type Tab = 'accounts' | 'users' | 'preferences';
	const tabs: { id: Tab; label: () => string }[] = [
		{ id: 'accounts', label: () => m.accounts_title() },
		{ id: 'users', label: () => m.users_title() },
		{ id: 'preferences', label: () => m.settings_preferences() }
	];

	function pickInitialTab(): Tab {
		const fromUrl = page.url.searchParams.get('tab');
		if (fromUrl === 'accounts' || fromUrl === 'users' || fromUrl === 'preferences') {
			return fromUrl;
		}
		if (page.url.searchParams.get('editUser')) return 'users';
		if (page.url.searchParams.get('edit')) return 'accounts';
		if (form && 'userError' in form) return 'users';
		if (form && ('errors' in form || 'deleteError' in form || 'raw' in form)) return 'accounts';
		if (form && 'currencyError' in form) return 'preferences';
		if (form && 'localeError' in form) return 'preferences';
		return 'accounts';
	}

	let activeTab = $state<Tab>(pickInitialTab());

	const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY'] as const;
	let currencyForm = $state<HTMLFormElement | null>(null);
	let languageForm = $state<HTMLFormElement | null>(null);

	const userError = $derived(
		form && 'userError' in form ? (form.userError as string | undefined) : undefined
	);
	const userErrorMessage = $derived(
		userError === 'login_taken'
			? m.users_error_login_taken()
			: userError === 'invalid'
				? m.users_error_invalid()
				: userError === 'self'
					? m.users_error_self_delete()
					: userError === 'last_admin'
						? m.users_error_last_admin()
						: userError === 'not_found'
							? m.users_error_not_found()
							: null
	);
	const userCreated = $derived(page.url.searchParams.get('created') === '1');
	const userSaved = $derived(page.url.searchParams.get('saved') === '1');

	const editingUser = $derived(data.editingUser);
	const editingSelf = $derived(
		editingUser !== null && editingUser?.id === data.currentUserId
	);
	const userRaw = $derived(
		form && 'raw' in form && form.raw && 'isAdmin' in (form.raw as object)
			? (form.raw as { id?: number; login?: string; isAdmin?: boolean })
			: null
	);
	const userInitial = $derived({
		id: editingUser?.id ?? null,
		login: (userRaw?.login as string | undefined) ?? editingUser?.login ?? '',
		isAdmin:
			userRaw?.isAdmin !== undefined
				? Boolean(userRaw.isAdmin)
				: (editingUser?.isAdmin ?? false)
	});

	function handleDeleteUser(e: SubmitEvent) {
		if (!confirm(m.users_confirm_delete())) e.preventDefault();
	}
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
	{:else if activeTab === 'users'}
		<section class="space-y-4">
			{#if userErrorMessage}
				<div class="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
					{userErrorMessage}
				</div>
			{/if}
			{#if userCreated}
				<div class="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
					{m.users_created()}
				</div>
			{/if}

			<div class="grid gap-6 lg:grid-cols-[2fr_1fr]">
				<div class="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
					<table class="min-w-full text-sm">
						<thead class="bg-slate-50 text-slate-600">
							<tr class="text-left">
								<th class="px-3 py-2 font-medium">{m.users_column_login()}</th>
								<th class="px-3 py-2 font-medium">{m.users_column_role()}</th>
								<th class="px-3 py-2 font-medium">{m.users_column_status()}</th>
								<th class="px-3 py-2 text-right font-medium">{m.users_column_actions()}</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100">
							{#each data.users as u (u.id)}
								{@const isSelf = u.id === data.currentUserId}
								<tr>
									<td class="px-3 py-2 font-medium">
										{u.login}
										{#if isSelf}
											<span class="ml-1 text-xs font-normal text-slate-500"
												>{m.users_self_badge()}</span
											>
										{/if}
									</td>
									<td class="px-3 py-2">
										{#if u.isAdmin}
											<span
												class="inline-flex rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-white"
												>{m.users_role_admin()}</span
											>
										{:else}
											<span
												class="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
												>{m.users_role_user()}</span
											>
										{/if}
									</td>
									<td class="px-3 py-2 text-xs text-slate-600">
										{#if u.forceReset}
											<span class="text-amber-700">{m.users_status_pending_reset()}</span>
										{:else}
											{m.users_status_ok()}
										{/if}
									</td>
									<td class="px-3 py-2 text-right">
										<div class="flex justify-end gap-1">
											<a
												href={`/settings?editUser=${u.id}`}
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
												action="?/deleteUser"
												use:enhance
												onsubmit={handleDeleteUser}
												class="contents"
											>
												<input type="hidden" name="id" value={u.id} />
												<button
													type="submit"
													disabled={isSelf}
													title={m.action_delete()}
													aria-label={m.action_delete()}
													class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
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

				<aside class="space-y-3">
					<h3 class="text-sm font-medium text-slate-700">
						{editingUser ? m.users_form_edit_title() : m.users_add()}
					</h3>
					<form
						method="POST"
						action="?/saveUser"
						use:enhance
						class="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
					>
						{#if userInitial.id}
							<input type="hidden" name="id" value={userInitial.id} />
						{/if}

						<label class="block space-y-1 text-sm">
							<span class="font-medium text-slate-700">{m.users_form_login()}</span>
							<input
								name="login"
								type="text"
								autocomplete="off"
								required
								value={userInitial.login}
								class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
							/>
						</label>

						<label class="block space-y-1 text-sm">
							<span class="font-medium text-slate-700">
								{editingUser ? m.users_form_password_optional() : m.users_form_password()}
							</span>
							<input
								name="password"
								type="password"
								autocomplete="new-password"
								required={!editingUser}
								minlength="8"
								placeholder={editingUser ? m.users_form_password_unchanged() : ''}
								class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
							/>
						</label>

						{#if editingSelf}
							<input type="hidden" name="isAdmin" value="on" />
						{/if}
						<label class="flex items-center gap-2 text-sm">
							<input
								name="isAdmin"
								type="checkbox"
								checked={userInitial.isAdmin}
								disabled={editingSelf}
								class="rounded border-slate-300 text-slate-900 focus:ring-slate-500 disabled:opacity-50"
							/>
							<span class="font-medium text-slate-700">{m.users_form_is_admin()}</span>
						</label>

						<div class="flex justify-end gap-2">
							{#if editingUser}
								<a
									href="/settings?tab=users"
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

					{#if userSaved}
						<p class="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
							{m.settings_saved()}
						</p>
					{/if}
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
	{/if}
</div>
