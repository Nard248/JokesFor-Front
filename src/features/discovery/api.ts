import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/axios'

export interface DiscoveryLanguage { code: string; name: string; native_name: string }
export interface DiscoveryCountry { code: string; name: string; native_name: string; language_codes: string[] }
export interface DiscoveryCulture { slug: string; name: string; native_name: string; description: string; language_codes: string[]; country_codes: string[] }
export interface DiscoveryCatalog {
  languages: DiscoveryLanguage[]
  countries: DiscoveryCountry[]
  cultures: DiscoveryCulture[]
  collections: Array<{ locale: string; language: string; country: string; culture: string; label: string; joke_count: number }>
}

export function useDiscoveryCatalog() {
  return useQuery({
    queryKey: ['discovery-locales'],
    queryFn: ({ signal }) => api.get<DiscoveryCatalog>('/discovery-locales/', { signal }).then((response) => response.data),
    staleTime: 1000 * 60 * 15,
    retry: 1,
  })
}
