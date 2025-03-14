"use client";

/**
 * Hook to track changed fields and prepare data for update
 */
import { useMemo } from 'react';
import isEqual from 'fast-deep-equal';
import { DeserializedValue } from './deserializeValue';
import { serializeValue } from './serializeValue';

/**
 * Compares initial and current values to determine which fields have changed
 * and prepares data for update
 * 
 * @param fields Record of field configurations
 * @param initialData Initial data from API
 * @param initialValue Deserialized initial values
 * @param currentValue Current form values
 * @returns Object containing changed fields and data for update
 */
export function useChangedFields(
  fields: Record<string, { path: string; viewsIndex: number; fieldMeta?: any }>,
  initialValue: DeserializedValue,
  currentValue: DeserializedValue
): { changedFields: Set<string>; dataForUpdate: Record<string, any> } {
  return useMemo(() => {
    const changedFields = new Set<string>();
    const dataForUpdate: Record<string, any> = {};
    
    // Get serialized values for comparison
    const initialSerialized = serializeValue(fields, initialValue);
    const currentSerialized = serializeValue(fields, currentValue);
    
    // Compare each field to detect changes
    Object.keys(currentValue).forEach((fieldPath) => {
      const initialVal = initialValue[fieldPath];
      const currentVal = currentValue[fieldPath];
      
      // Skip error values
      if (currentVal.kind === 'error') return;
      
      // Compare serialized values
      const initialFieldValue = initialSerialized[fieldPath];
      const currentFieldValue = currentSerialized[fieldPath];
      
      if (!isEqual(initialFieldValue, currentFieldValue)) {
        changedFields.add(fieldPath);
        dataForUpdate[fieldPath] = currentFieldValue;
      }
    });
    
    return { changedFields, dataForUpdate };
  }, [fields, initialValue, currentValue]);
} 