/**
 * Utility to deserialize field values from API data
 */
import { getFieldTypeFromViewsIndex, getClientField } from "@/views/registry";

export type DeserializedValue = Record<
  string,
  { kind: 'value'; value: any } | { kind: 'error'; errors: any[] }
>;

/**
 * Deserializes raw API data into form-compatible values
 * 
 * @param fields Record of field configurations
 * @param data Raw data from API
 * @returns Deserialized values for each field
 */
export function deserializeValue(
  fields: Record<string, { path: string; viewsIndex: number; fieldMeta?: any }>,
  data: Record<string, any> | null
): DeserializedValue {
  const value: DeserializedValue = {};
  if (!data) return value;

  Object.keys(fields).forEach((fieldPath) => {
    const field = fields[fieldPath];
    const fieldType = getFieldTypeFromViewsIndex(field.viewsIndex);
    const fieldImpl = getClientField(fieldType);
    const controller = fieldImpl?.controller?.(field);

    if (controller?.deserialize) {
      try {
        const rawValue = data[fieldPath];
        const deserialized = controller.deserialize({ [fieldPath]: rawValue });
        value[fieldPath] = { kind: 'value', value: deserialized.value };
      } catch (error) {
        value[fieldPath] = { kind: 'error', errors: [{ message: `Failed to deserialize ${fieldPath}` }] };
      }
    } else {
      // Default deserialization for fields without a controller
      value[fieldPath] = { kind: 'value', value: data[fieldPath] };
    }
  });

  return value;
} 