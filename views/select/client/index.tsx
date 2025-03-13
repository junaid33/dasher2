/**
 * Client-side implementation for select fields
 */

"use client"

import React, { useMemo, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface Option {
  value: string
  label: string
}

interface Field {
  path: string
  label: string
  description?: string
  options?: Option[]
  isRequired?: boolean
  displayMode?: 'select' | 'radio' | 'segmented-control'
  fieldMeta?: {
    options?: Array<{ value: any; label: string }>;
    isRequired?: boolean;
    type?: string;
    displayMode?: 'select' | 'radio' | 'segmented-control';
    defaultValue?: any;
    validation?: any;
    isNullable?: boolean;
  }
}

interface FilterProps {
  value: string
  onChange: (value: string) => void
  operator: keyof FilterTypes
  field: Field
}

interface CellProps {
  item: Record<string, any>
  field: Field
}

interface FieldProps {
  field: Field;
  value?: Value;
  rawValue?: any;
  kind?: 'create' | 'update';
  onChange?: (value: Value) => void;
  autoFocus?: boolean;
  forceValidation?: boolean;
}

interface FilterLabelProps {
  label: string
  type: keyof FilterTypes
  value: string
}

interface GraphQLProps {
  path: string
  type: keyof FilterTypes
  value: string
}

interface FilterType {
  label: string
  initialValue: string | string[]
}

interface FilterTypes {
  in: FilterType
  not_in: FilterType
  equals: FilterType
  not_equals: FilterType
}

type Value =
  | { value: Option | null; kind: 'create' }
  | { value: Option | null; initial: Option | null; kind: 'update' }

// Filter component for select fields
export function Filter({ value, onChange, operator, field }: FilterProps) {
  const filterType = getFilterTypes()[operator]
  
  if (!filterType) return null
  
  let values: string[]
  try {
    values = JSON.parse(value)
  } catch (e) {
    values = value ? [value] : []
  }
  
  const options = field.options || []
  
  if (operator === 'equals' || operator === 'not_equals') {
    return (
      <Select
        value={values[0] || ""}
        onValueChange={(newValue) => onChange(newValue)}
      >
        <SelectTrigger className="h-8">
          <SelectValue placeholder="Select option" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }
  
  // For 'in' and 'not_in' operators, we use checkboxes
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <div key={option.value} className="flex items-center space-x-2">
          <Checkbox 
            id={`filter-${field.path}-${option.value}`}
            checked={values.includes(option.value)}
            onCheckedChange={(checked) => {
              const newValues = checked 
                ? [...values, option.value]
                : values.filter(v => v !== option.value);
              onChange(JSON.stringify(newValues));
            }}
          />
          <label 
            htmlFor={`filter-${field.path}-${option.value}`}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {option.label}
          </label>
        </div>
      ))}
    </div>
  )
}

// Get available filter types for select fields
export function getFilterTypes(): FilterTypes {
  return {
    in: {
      label: "Is any of",
      initialValue: [],
    },
    not_in: {
      label: "Is none of",
      initialValue: [],
    },
    equals: {
      label: "Is exactly",
      initialValue: "",
    },
    not_equals: {
      label: "Is not",
      initialValue: "",
    },
  }
}

// Cell renderer for list view
export function Cell({ item, field }: CellProps) {
  const value = item[field.path]
  if (value === null) return null

  const option = field.options?.find((opt) => opt.value === value)
  return option ? option.label : String(value)
}

// Field component for forms
export function Field({ field, value, rawValue, kind = 'update', onChange, autoFocus, forceValidation }: FieldProps) {
  // Handle internal deserialization if rawValue is provided
  const processedValue = useMemo(() => {
    if (rawValue !== undefined) {
      // Create a controller directly - no need for it to be passed in
      const fieldController = controller({
        path: field.path,
        label: field.label,
        description: field.description,
        fieldMeta: field.fieldMeta || {}
      });
      
      // Deserialize the raw value and ensure it has the correct type
      const deserialized = fieldController.deserialize({ [field.path]: rawValue });
      
      // Make sure it conforms to the Value type
      if (deserialized.kind === 'update') {
        return {
          kind: 'update' as const,
          initial: deserialized.initial,
          value: deserialized.value
        };
      } else {
        return {
          kind: 'create' as const,
          value: deserialized.value
        };
      }
    }
    
    // If regular value is provided, use it directly
    return value;
  }, [field, rawValue, value]);

  const [isDirty, setDirty] = useState(false);
  const [preNullValue, setPreNullValue] = useState<Option | null>(
    processedValue?.value || (processedValue?.kind === 'update' ? processedValue?.initial : null)
  );
  
  // Get options from fieldMeta instead of relying on field.options
  const options = useMemo(() => {
    // Use fieldMeta.options as the source of truth
    const metaOptions = field.fieldMeta?.options || [];
    
    // Convert options to the expected format (ensure values are strings)
    return metaOptions.map((option: any) => ({
      label: option.label,
      value: option.value.toString()
    }));
    
    // Fallback to field.options if available
  }, [field.fieldMeta?.options, field.options]);
  
  const selectedKey = processedValue?.value === null ? null : processedValue?.value?.value || null;
  
  const isNullable = !field.isRequired;
  const isNull = isNullable && processedValue?.value === null;
  const isInvalid = !validate(processedValue, field.isRequired || false);
  const isReadOnly = onChange == null;
  const errorMessage = isInvalid && (isDirty || forceValidation) 
    ? `${field.label} is required.` 
    : undefined;
  
  const onSelectionChange = (key: string) => {
    if (!onChange) return;
    
    const newValue = options.find(opt => opt.value === key) || null;
    
    if (processedValue?.kind === 'update') {
      onChange({
        kind: 'update',
        initial: processedValue.initial,
        value: newValue
      });
    } else {
      onChange({
        kind: 'create',
        value: newValue
      });
    }
    
    setDirty(true);
  };
  
  const onNullChange = (isChecked: boolean) => {
    if (!onChange) return;
    
    if (isChecked) {
      if (processedValue?.kind === 'update') {
        onChange({
          kind: 'update',
          initial: processedValue.initial,
          value: null
        });
      } else {
        onChange({
          kind: 'create',
          value: null
        });
      }
      
      setPreNullValue(processedValue?.value || null);
    } else {
      if (processedValue?.kind === 'update') {
        onChange({
          kind: 'update',
          initial: processedValue.initial,
          value: preNullValue || options[0] || null
        });
      } else {
        onChange({
          kind: 'create',
          value: preNullValue || options[0] || null
        });
      }
    }
    
    setDirty(true);
  };
  
  // Render different field types based on displayMode
  const fieldElement = (() => {
    switch (field.displayMode) {
      case 'radio':
        return (
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className={errorMessage ? "text-destructive" : ""}>
                {field.label}
                {field.isRequired && <span className="text-destructive ml-1">*</span>}
              </Label>
            </div>
            
            <RadioGroup
              value={selectedKey || ""}
              onValueChange={onSelectionChange}
              disabled={isNull || isReadOnly}
            >
              {options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${field.path}-${option.value}`} />
                  <Label htmlFor={`${field.path}-${option.value}`} className="font-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            
            {field.description && !errorMessage && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            
            {errorMessage && (
              <p className="text-sm text-destructive">{errorMessage}</p>
            )}
          </div>
        );
      
      case 'segmented-control':
        // Simplified segmented control using radio group with horizontal layout
        return (
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className={errorMessage ? "text-destructive" : ""}>
                {field.label}
                {field.isRequired && <span className="text-destructive ml-1">*</span>}
              </Label>
            </div>
            
            <RadioGroup
              value={selectedKey || ""}
              onValueChange={onSelectionChange}
              disabled={isNull || isReadOnly}
              className="flex space-x-1"
            >
              {options.map((option) => (
                <div key={option.value} className="flex-1">
                  <Label
                    htmlFor={`${field.path}-${option.value}`}
                    className={`flex items-center justify-center h-9 rounded-md border border-input px-3 py-2 text-sm ring-offset-background cursor-pointer ${
                      selectedKey === option.value 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <RadioGroupItem 
                      value={option.value} 
                      id={`${field.path}-${option.value}`} 
                      className="sr-only"
                    />
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            
            {field.description && !errorMessage && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            
            {errorMessage && (
              <p className="text-sm text-destructive">{errorMessage}</p>
            )}
          </div>
        );
      
      default:
        // Default select dropdown
        return (
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label
                htmlFor={field.path}
                className={errorMessage ? "text-destructive" : ""}
              >
                {field.label}
                {field.isRequired && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </Label>
            </div>
            <Select
              value={selectedKey !== null ? selectedKey : ""}
              onValueChange={onSelectionChange}
              disabled={isNull}
            >
              <SelectTrigger id={field.path} autoFocus={autoFocus}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {field.description && !errorMessage && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            
            {errorMessage && (
              <p className="text-sm text-destructive">{errorMessage}</p>
            )}
          </div>
        );
    }
  })();
  
  // If the field is nullable, wrap it with null checkbox
  return (
    <div className="space-y-4">
      {fieldElement}
    </div>
  );
}

// Filter controller for select fields
export const filter = {
  Filter,
  types: getFilterTypes(),
  Label: ({ label, type, value }: FilterLabelProps) => {
    const filterType = getFilterTypes()[type]
    if (!filterType) return ""

    let values: string[]
    try {
      values = JSON.parse(value)
    } catch (e) {
      values = value ? [value] : []
    }

    return `${label} ${filterType.label.toLowerCase()}: ${values.join(", ")}`
  },
  graphql: ({ path, type, value }: GraphQLProps) => {
    let values: string[]
    try {
      values = JSON.parse(value)
    } catch (e) {
      values = value ? [value] : []
    }

    if (values.length === 0) return {}

    switch (type) {
      case 'equals':
        return { [path]: { equals: values[0] } }
      case 'not_equals':
        return { [path]: { not: { equals: values[0] } } }
      case 'in':
        return { [path]: { in: values } }
      case 'not_in':
        return { [path]: { not: { in: values } } }
      default:
        return {}
    }
  }
}

/**
 * Validate a select field value
 */
function validate(value: Value | undefined, isRequired: boolean) {
  if (!isRequired) return true;
  if (!value) return false;
  
  // If this is an update and the initial value was null, we want to allow saving
  // since the user probably doesn't have read access control
  if (value.kind === 'update' && value.initial === null) return true;
  
  return value.value !== null;
}

/**
 * Controller for select fields
 */
export const controller = (config: any) => {
  const options = config.fieldMeta?.options || [];
  const optionsWithStringValues = options.map((option: any) => ({
    label: option.label,
    value: option.value.toString(),
  }));
  
  // Transform from string value to type appropriate value
  const t = (v: string | null) =>
    v === null ? null : config.fieldMeta?.type === 'integer' ? parseInt(v) : v;
  
  const stringifiedDefault = config.fieldMeta?.defaultValue?.toString();
  
  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: config.path,
    options: optionsWithStringValues,
    defaultValue: {
      kind: 'create',
      value: optionsWithStringValues.find((opt: Option) => opt.value === stringifiedDefault) || null,
    },
    displayMode: config.fieldMeta?.displayMode || 'select',
    type: config.fieldMeta?.type || 'string',
    isRequired: config.fieldMeta?.isRequired || false,
    deserialize: (data: Record<string, any>) => {
      const value = data[config.path];
      
      // Handle null values
      if (value === null || value === undefined) {
        return { kind: 'update', initial: null, value: null };
      }
      
      // Convert value to string for comparison
      const valueStr = value.toString();
      
      // Find matching option
      for (const option of optionsWithStringValues) {
        if (option.value === valueStr) {
          return {
            kind: 'update',
            initial: option,
            value: option,
          };
        }
      }
      
      // If no match found but we have a value, create a synthetic option
      // This can happen if the option list changed or data is inconsistent
      if (value !== null && value !== undefined) {
        const syntheticOption = {
          label: String(value),
          value: valueStr
        };
        
        return { 
          kind: 'update', 
          initial: syntheticOption,
          value: syntheticOption 
        };
      }
      
      return { kind: 'update', initial: null, value: null };
    },
    serialize: (value: Value) => ({
      [config.path]: t(value.value?.value || null),
    }),
    validate: (value: Value) => validate(value, config.fieldMeta?.isRequired || false),
  };
};

