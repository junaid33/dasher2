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
}

export function ItemFormFields({
  fields,
  itemData,
  kind = "update",
}: ItemFormFieldsProps) {
  return (
    <>
      {fields.map((field: Field) => {
        const fieldType = getFieldTypeFromViewsIndex(field.viewsIndex);
        const fieldImpl = getClientField(fieldType);
        const FieldComponent = fieldImpl?.Field;

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
          <div key={field.path} className="space-y-2">
            <FieldComponent
              field={field}
              rawValue={itemData[field.path]}
              kind={kind}
              onChange={() => {
                console.log("onChange");
              }}
            />
            {/* <Select defaultValue="1">
              <SelectTrigger>
                <SelectValue placeholder="Select framework" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">React</SelectItem>
                <SelectItem value="2">Next.js</SelectItem>
                <SelectItem value="3">Astro</SelectItem>
                <SelectItem value="4">Gatsby</SelectItem>
              </SelectContent>
            </Select> */}
          </div>
        );
      })}
    </>
  );
}
