/**
 * Utility to delete an item via the API
 */
import { deleteItem } from "@/lib/graphql";
import { getAdminMeta } from "@/lib/hooks/getAdminMeta";

/**
 * Deletes an item by ID
 * 
 * @param listKey The key of the list
 * @param id The ID of the item
 * @returns Promise resolving to the deletion result
 */
export async function deleteItemData(listKey: string, id: string) {
  try {
    // Get the admin metadata
    const adminMeta = await getAdminMeta();
    
    // Get the list from the admin metadata
    const list = adminMeta.lists[listKey];
    
    if (!list) {
      throw new Error(`List with key ${listKey} not found`);
    }
    
    // Use the existing deleteItem function to delete the item
    const result = await deleteItem(list, id);
    
    return result;
  } catch (error) {
    throw error;
  }
} 