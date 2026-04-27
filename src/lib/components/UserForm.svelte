<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	type UserInit = {
		id: number | null;
		login: string;
		isAdmin: boolean;
	};

	let {
		initial,
		isEditingSelf = false,
		isEdit = false,
		action = '?/saveUser',
		onSuccess,
		onCancel
	}: {
		initial: UserInit;
		isEditingSelf?: boolean;
		isEdit?: boolean;
		action?: string;
		onSuccess?: () => void;
		onCancel?: () => void;
	} = $props();
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
		<span class="font-medium text-slate-700">{m.users_form_login()}</span>
		<input
			name="login"
			type="text"
			autocomplete="off"
			required
			value={initial.login}
			class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
		/>
	</label>

	<label class="block space-y-1 text-sm">
		<span class="font-medium text-slate-700">
			{isEdit ? m.users_form_password_optional() : m.users_form_password()}
		</span>
		<input
			name="password"
			type="password"
			autocomplete="new-password"
			required={!isEdit}
			minlength="8"
			placeholder={isEdit ? m.users_form_password_unchanged() : ''}
			class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
		/>
	</label>

	{#if isEditingSelf}
		<input type="hidden" name="isAdmin" value="on" />
	{/if}
	<label class="flex items-center gap-2 text-sm">
		<input
			name="isAdmin"
			type="checkbox"
			checked={initial.isAdmin}
			disabled={isEditingSelf}
			class="rounded border-slate-300 text-slate-900 focus:ring-slate-500 disabled:opacity-50"
		/>
		<span class="font-medium text-slate-700">{m.users_form_is_admin()}</span>
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
