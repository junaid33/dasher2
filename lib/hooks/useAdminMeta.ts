import useSWR from 'swr';
import { AdminMeta } from './types';
import { fetchAdminMeta } from './adminMetaFetcher';

/**
 * Custom hook to fetch and cache admin metadata
 * This will only fetch once and never revalidate since admin metadata
 * doesn't change during runtime
 */
export function useAdminMeta() {
  const { data, error, isLoading } = useSWR<AdminMeta>(
    'keystoneAdminMeta',
    () => fetchAdminMeta(false), // Don't include gqlNames in client version to reduce payload size
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: Infinity, // Never dedupe
    }
  );

  return {
    adminMeta: data,
    isLoading,
    error,
  };
}

/**
 * Get a specific list by its key
 */
export function useList(listKey: string) {
  const { adminMeta, isLoading, error } = useAdminMeta();
  
  return {
    list: adminMeta?.lists?.[listKey],
    isLoading,
    error,
  };
}

/**
 * Get a specific list by its path
 */
export function useListByPath(path: string) {
  const { adminMeta, isLoading, error } = useAdminMeta();
  
  return {
    list: adminMeta?.listsByPath?.[path],
    isLoading,
    error,
  };
} 