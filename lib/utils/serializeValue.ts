/**
 * Utility to serialize form values for API submission
 */
import { getFieldTypeFromViewsIndex, getClientField } from "@/views/registry";
import { DeserializedValue } from "./deserializeValue";

/**
 * Serializes form values back to an object for API submission
 * 
 * @param fields Record of field configurations
 * @param value Deserialized form values
 * @returns Serialized data for API submission
 */
export function serializeValue(
  fields: Record<string, { path: string; viewsIndex: number; fieldMeta?: any }>,
  value: DeserializedValue
): Record<string, any> {
  const obj: Record<string, any> = {};
  
  Object.keys(value).forEach((fieldPath) => {
    const val = value[fieldPath];
    if (val.kind === 'value') {
      const field = fields[fieldPath];
      const fieldType = getFieldTypeFromViewsIndex(field.viewsIndex);
      const fieldImpl = getClientField(fieldType);
      const controller = fieldImpl?.controller?.(field);
      
      if (controller?.serialize) {
        try {
          const serialized = controller.serialize(val.value);
          Object.assign(obj, serialized);
        } catch (error) {
          // If serialization fails, use the raw value
          obj[fieldPath] = val.value;
        }
      } else {
        // Default serialization for fields without a controller
        obj[fieldPath] = val.value;
      }
    }
  });
  
  return obj;
} 