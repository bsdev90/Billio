// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface Locals {
			authenticated: boolean;
			forceReset: boolean;
		}
		interface PageData {
			authenticated?: boolean;
			forceReset?: boolean;
		}
		// interface Error {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
