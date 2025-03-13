import { cache } from 'react';
import { AdminMeta } from './types';
import { fetchAdminMeta } from './adminMetaFetcher';

/**
 * Fetches admin metadata with React cache for server components
 * This uses React's cache function to deduplicate requests
 */
export const getAdminMeta = cache(async (): Promise<AdminMeta> => {
  return fetchAdminMeta(true); // Include gqlNames for server-side operations
});

/**
 * Get a specific list by its key
 */
export async function getList(listKey: string) {
  const adminMeta = await getAdminMeta();
  return adminMeta.lists[listKey];
}

/**
 * Get a specific list by its path
 */
export async function getListByPath(path: string) {
  const adminMeta = await getAdminMeta();
  return adminMeta.listsByPath[path];
} 