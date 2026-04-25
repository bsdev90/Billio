<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import EntryForm from '$lib/components/EntryForm.svelte';

	let { data, form } = $props();

	const raw = $derived(form?.raw ?? null);

	const initial = $derived({
		label: raw?.label ?? data.entry.label,
		type: ((raw?.type === 'abonnement' || raw?.type === 'charge'
			? raw.type
			: data.entry.type) as 'abonnement' | 'charge'),
		accountId:
			raw?.accountId != null && raw.accountId !== ''
				? Number(raw.accountId)
				: data.entry.accountId,
		periodicity: ((raw?.periodicity === 'mensuel' ||
		raw?.periodicity === 'trimestriel' ||
		raw?.periodicity === 'annuel'
			? raw.periodicity
			: data.entry.periodicity) as 'mensuel' | 'trimestriel' | 'annuel'),
		amount:
			raw?.amount ??
			(data.entry.amountCents / 100).toFixed(2).replace('.', ','),
		day: raw?.day ?? (data.entry.day != null ? String(data.entry.day) : ''),
		notes: raw?.notes ?? data.entry.notes ?? '',
		isActive: raw != null ? raw.isActive != null : data.entry.isActive
	});
</script>

<svelte:head><title>{m.entries_form_edit_title()} · {m.app_name()}</title></svelte:head>

<div class="mx-auto max-w-2xl space-y-4">
	<h1 class="text-2xl font-semibold text-slate-900">{m.entries_form_edit_title()}</h1>
	<EntryForm
		accounts={data.accounts}
		{initial}
		errors={form?.errors}
		submitLabel={m.action_save()}
		cancelHref="/"
	/>
</div>
