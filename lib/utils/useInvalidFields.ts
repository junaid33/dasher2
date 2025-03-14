"use client";

/**
 * Hook to identify invalid fields based on validation rules
 */
import { useMemo } from 'react';
import { getFieldTypeFromViewsIndex, getClientField } from '@/views/registry';
import { DeserializedValue } from './deserializeValue';

/**
 * Identifies invalid fields based on field validation rules
 * 
 * @param fields Record of field configurations
 * @param value Current form values
 * @returns Set of invalid field paths
 */
export function useInvalidFields(
  fields: Record<string, { path: string; viewsIndex: number; fieldMeta?: any }>,
  value: DeserializedValue
): Set<string> {
  return useMemo(() => {
    const invalidFields = new Set<string>();
    
    Object.keys(value).forEach((fieldPath) => {
      const val = value[fieldPath];
      
      // Skip fields with error values
      if (val.kind === 'error') {
        invalidFields.add(fieldPath);
        return;
      }
      
      const field = fields[fieldPath];
      const fieldType = getFieldTypeFromViewsIndex(field.viewsIndex);
      const fieldImpl = getClientField(fieldType);
      const controller = fieldImpl?.controller?.(field);
      
      // Use controller's validate function if available
      if (controller?.validate) {
        try {
          const isValid = controller.validate(val.value);
          if (!isValid) {
            invalidFields.add(fieldPath);
          }
        } catch (error) {
          // If validation throws an error, consider the field invalid
          invalidFields.add(fieldPath);
        }
      } else {
        // Basic validation for required fields
        const isRequired = field.fieldMeta?.isRequired || field.fieldMeta?.validation?.isRequired;
        if (isRequired && (val.value === null || val.value === undefined || val.value === '')) {
          invalidFields.add(fieldPath);
        }
      }
    });
    
    return invalidFields;
  }, [fields, value]);
} 