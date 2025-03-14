/**
 * Utility to update item data via the API
 */
import { updateItem } from "@/lib/graphql";
import { getAdminMeta } from "@/lib/hooks/getAdminMeta";

/**
 * Updates an item with the provided data
 * 
 * @param listKey The key of the list
 * @param id The ID of the item
 * @param data The data to update
 * @returns Promise resolving to the updated item
 */
export async function updateItemData(listKey: string, id: string, data: Record<string, any>) {
  try {
    // Get the admin metadata
    const adminMeta = await getAdminMeta();
    
    // Get the list from the admin metadata
    const list = adminMeta.lists[listKey];
    
    if (!list) {
      throw new Error(`List with key ${listKey} not found`);
    }
    
    // Use the existing updateItem function to update the item
    const result = await updateItem(list, id, data);
    
    return result.item;
  } catch (error) {
    throw error;
  }
} 