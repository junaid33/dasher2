/**
 * Utility to fetch item data from the API
 */
import { getItem } from "@/lib/graphql";
import { getAdminMeta } from "@/lib/hooks/getAdminMeta";

/**
 * Fetches item data and admin metadata from the API
 * 
 * @param listKey The key of the list
 * @param id The ID of the item
 * @returns Promise resolving to item data and admin metadata
 */
export async function fetchItemData(listKey: string, id: string) {
  try {
    // Get the admin metadata
    const adminMeta = await getAdminMeta();
    
    // Get the list from the admin metadata
    const list = adminMeta.lists[listKey];
    
    if (!list) {
      throw new Error(`List with key ${listKey} not found`);
    }
    
    // Use the existing getItem function to fetch the item data
    const itemData = await getItem(list, id);
    
    // Return both the item data and admin metadata
    return {
      item: itemData.item,
      adminMeta
    };
  } catch (error) {
    throw error;
  }
} 