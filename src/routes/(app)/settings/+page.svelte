<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { locales } from '$lib/paraglide/runtime';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import Modal from '$lib/components/Modal.svelte';
	import AccountForm from '$lib/components/AccountForm.svelte';
	import UserForm from '$lib/components/UserForm.svelte';

	let { data, form } = $props();

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

	function handleDeleteUser(e: SubmitEvent) {
		if (!confirm(m.users_confirm_delete())) e.preventDefault();
	}

	type AccountRow = (typeof data.accounts)[number];
	type UserRow = (typeof data.users)[number];

	const COLOR_PALETTE_DEFAULT = '#f6aace';

	let accountModalOpen = $state(false);
	let editingAccount = $state<AccountRow | null>(null);

	function openNewAccount() {
		editingAccount = null;
		accountModalOpen = true;
	}

	function openEditAccount(account: AccountRow) {
		editingAccount = account;
		accountModalOpen = true;
	}

	const accountFormInitial = $derived({
		id: editingAccount?.id ?? null,
		name: editingAccount?.name ?? '',
		color: editingAccount?.color ?? COLOR_PALETTE_DEFAULT,
		position: String(editingAccount?.position ?? 0)
	});

	let userModalOpen = $state(false);
	let editingUser = $state<UserRow | null>(null);

	function openNewUser() {
		editingUser = null;
		userModalOpen = true;
	}

	function openEditUser(u: UserRow) {
		editingUser = u;
		userModalOpen = true;
	}

	const userFormInitial = $derived({
		id: editingUser?.id ?? null,
		login: editingUser?.login ?? '',
		isAdmin: editingUser?.isAdmin ?? false
	});

	const editingSelf = $derived(
		editingUser !== null && editingUser?.id === data.currentUserId
	);
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

			<div class="flex justify-end">
				<button
					type="button"
					onclick={openNewAccount}
					class="cursor-pointer rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
				>
					+ {m.accounts_add()}
				</button>
			</div>

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
								<th class="px-3 py-2 text-center font-medium">{m.accounts_column_position()}</th>
								<th class="px-3 py-2 text-right font-medium">{m.accounts_column_entries()}</th>
								<th class="px-3 py-2 text-right font-medium">{m.accounts_column_actions()}</th>
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
											<button
												type="button"
												onclick={() => openEditAccount(a)}
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
											</button>
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
		</section>
	{:else if activeTab === 'users'}
		<section class="space-y-4">
			{#if userErrorMessage}
				<div class="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
					{userErrorMessage}
				</div>
			{/if}

			<div class="flex justify-end">
				<button
					type="button"
					onclick={openNewUser}
					class="cursor-pointer rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
				>
					+ {m.users_add()}
				</button>
			</div>

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
										<button
											type="button"
											onclick={() => openEditUser(u)}
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
										</button>
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

<Modal
	open={accountModalOpen}
	title={editingAccount ? m.accounts_form_edit_title() : m.accounts_form_new_title()}
	onClose={() => (accountModalOpen = false)}
>
	<AccountForm
		initial={accountFormInitial}
		onSuccess={() => (accountModalOpen = false)}
		onCancel={() => (accountModalOpen = false)}
	/>
</Modal>

<Modal
	open={userModalOpen}
	title={editingUser ? m.users_form_edit_title() : m.users_add()}
	onClose={() => (userModalOpen = false)}
>
	<UserForm
		initial={userFormInitial}
		isEdit={editingUser !== null}
		isEditingSelf={editingSelf}
		onSuccess={() => (userModalOpen = false)}
		onCancel={() => (userModalOpen = false)}
	/>
</Modal>
