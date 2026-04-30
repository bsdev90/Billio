<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import EntryForm from '$lib/components/EntryForm.svelte';

	let { data, form } = $props();

	const raw = $derived(form?.raw ?? null);

	const initial = $derived({
		label: raw?.label ?? '',
		type: (raw?.type === 'abonnement' || raw?.type === 'charge' || raw?.type === 'epargne'
			? raw.type
			: 'abonnement') as 'abonnement' | 'charge' | 'epargne',
		accountId:
			raw?.accountId != null && raw.accountId !== ''
				? Number(raw.accountId)
				: (data.accounts[0]?.id ?? null),
		periodicity: (raw?.periodicity === 'mensuel' ||
		raw?.periodicity === 'trimestriel' ||
		raw?.periodicity === 'annuel'
			? raw.periodicity
			: 'mensuel') as 'mensuel' | 'trimestriel' | 'annuel',
		amount: raw?.amount ?? '',
		day: raw?.day ?? '',
		notes: raw?.notes ?? '',
		isActive: true
	});
</script>

<svelte:head><title>{m.entries_form_new_title()} · {m.app_name()}</title></svelte:head>

<div class="mx-auto max-w-2xl space-y-4">
	<h1 class="text-2xl font-semibold text-slate-900">{m.entries_form_new_title()}</h1>
	<EntryForm
		accounts={data.accounts}
		{initial}
		errors={form?.errors}
		submitLabel={m.action_save()}
		cancelHref="/"
	/>
</div>
