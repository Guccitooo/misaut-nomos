import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			// CAMBIO: staleTime global — datos considerados "frescos" durante 5 min
			// Esto evita re-fetches innecesarios al navegar entre páginas
			staleTime: 1000 * 60 * 5,
		},
	},
});