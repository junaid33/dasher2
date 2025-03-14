"use client";
import { getFieldTypeFromViewsIndex, getClientField } from "@/views/registry";

interface Field {
  path: string;
  label: string;
  viewsIndex: number;
  description?: string;
  fieldMeta?: {
    validation?: {
      isRequired?: boolean;
      length?: { min: number | null; max: number | null };
      match?: { regex: RegExp; explanation?: string };
    };
    defaultValue?: any;
    isNullable?: boolean;
    options?: Array<{ value: any; label: string }>;
  };
  itemView?: {
    fieldMode?: string;
    fieldPosition?: string;
  };
}

interface ItemFormFieldsProps {
  fields: Field[];
  itemData: Record<string, any>;
  kind?: "create" | "update";
  onChange?: (fieldPath: string) => (newValue: any) => void;
  forceValidation?: boolean;
  initialValues?: Record<string, any>;
  currentValues?: Record<string, any>;
  showDebugInfo?: boolean;
  changedFields?: Set<string>;
}

// Helper function to stringify values for display
function stringifyValue(value: any): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return "[Complex Object]";
    }
  }
  return String(value);
}

export function ItemFormFields({
  fields,
  itemData,
  kind = "update",
  onChange,
  forceValidation = false,
  initialValues,
  currentValues,
  showDebugInfo = false,
  changedFields,
}: ItemFormFieldsProps) {
  return (
    <>
      {fields.map((field: Field) => {
        const fieldType = getFieldTypeFromViewsIndex(field.viewsIndex);
        const fieldImpl = getClientField(fieldType);
        const FieldComponent = fieldImpl?.Field;

        // Get initial and current values for debugging
        const initialValue = initialValues?.[field.path];
        const currentValue = currentValues?.[field.path];

        // Check if this field has changed (using the Set passed from parent)
        const hasChanged = changedFields
          ? changedFields.has(field.path)
          : false;

        if (!FieldComponent) {
          return (
            <div key={field.path} className="space-y-2">
              <label className="text-sm font-medium">{field.label}</label>
              <div className="text-muted-foreground">
                Field type {fieldType} not implemented
              </div>
            </div>
          );
        }

        return (
          <div key={field.path} className="space-y-2 mb-6">
            {/* Debug info card */}
            {showDebugInfo && (
              <div
                className={`p-3 rounded-md text-xs font-mono ${
                  hasChanged
                    ? "bg-amber-50 border border-amber-200"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold">{field.path}</span>
                  {hasChanged && (
                    <span className="px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full text-xs">
                      Changed
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-gray-500 mb-1">Initial Value:</div>
                    <div className="bg-white p-2 rounded border border-gray-200 overflow-x-auto">
                      {stringifyValue(initialValue)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">Current Value:</div>
                    <div className="bg-white p-2 rounded border border-gray-200 overflow-x-auto">
                      {stringifyValue(currentValue)}
                    </div>
                  </div>
                </div>
                <div className="text-gray-500 mt-2 mb-1">Raw Value:</div>
                <pre className="bg-white p-2 rounded border border-gray-200 overflow-x-auto text-xs max-h-24">
                  {JSON.stringify(itemData[field.path], null, 2)}
                </pre>
              </div>
            )}

            {/* Actual field component */}
            <FieldComponent
              field={field}
              rawValue={itemData[field.path]}
              kind={kind}
              onChange={onChange ? onChange(field.path) : undefined}
              forceValidation={forceValidation}
            />
          </div>
        );
      })}
    </>
  );
}
