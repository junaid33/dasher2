// Relationship/client/index.js (Server Component)
import { fetchRelationshipData, FieldProps, FieldMeta } from "../server";
import { Label } from "@/components/ui/label";
import ClientField from "./Field";
import SelectedOptionLabel from "../server/SelectedOptionLabel";

interface FilterProps {
  value: string;
  onChange: (value: string) => void;
}

interface FilterTypes {
  contains: { label: string; initialValue: string };
  not_contains: { label: string; initialValue: string };
  is: { label: string; initialValue: string };
  is_not: { label: string; initialValue: string };
}

interface CellProps {
  item: Record<string, any>;
  field: { path: string; label: string; fieldMeta: FieldMeta };
}

export async function Field({ field, value, onChange }: FieldProps) {
  const { options, searchFields, plural } = await fetchRelationshipData(field);
  const { refListKey, refLabelField = "id", many } = field.fieldMeta;

  const selectedOptions = value?.value
    ? Array.isArray(value.value)
      ? value.value.map((item: any) => ({
          value: item.id,
          label: <SelectedOptionLabel id={item.id} listKey={refListKey} labelField={refLabelField} />,
          data: item
        }))
      : [{ 
          value: value.value.id,
          label: <SelectedOptionLabel id={value.value.id} listKey={refListKey} labelField={refLabelField} />,
          data: value.value 
        }]
    : [];

  return (
    <div className="grid gap-2">
      <Label>{field.label}</Label>
      <ClientField
        options={options}
        selectedOptions={selectedOptions}
        searchFields={searchFields}
        plural={plural}
        many={many}
        refLabelField={refLabelField}
        onChange={onChange}
        field={field}
        value={value}
      />
      {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
    </div>
  );
}

export function Filter({ value, onChange }: FilterProps) {
  return (
    <MultipleSelector
      value={value ? [{ value, label: value }] : []}
      onChange={(newValues) => onChange(newValues[0]?.value || "")}
      maxSelected={1}
      placeholder="Search..."
      className="h-8"
      options={[]}
    />
  );
}

export function getFilterTypes(): FilterTypes {
  return {
    contains: { label: "Contains", initialValue: "" },
    not_contains: { label: "Does not contain", initialValue: "" },
    is: { label: "Is", initialValue: "" },
    is_not: { label: "Is not", initialValue: "" },
  };
}

export function Cell({ item, field }: CellProps) {
  const value = item[field.path];
  if (!value) return <span className="text-muted-foreground">Not set</span>;
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((v) => (
          <span key={v.id} className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs">
            {v.label || v.id}
          </span>
        ))}
      </div>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs">
      {value.label || value.id}
    </span>
  );
}

export const filter = {
  Filter,
  types: getFilterTypes(),
  Label: ({ label, type, value }: { label: string; type: keyof FilterTypes; value: string }) => {
    const filterType = getFilterTypes()[type];
    return filterType ? `${label} ${filterType.label.toLowerCase()}: ${value}` : "";
  },
  graphql: ({ path, type, value }: { path: string; type: keyof FilterTypes; value: string }) => {
    if (!value) return {};
    const isValidId = /^[0-9a-fA-F]{24}$/.test(value) || /^\d+$/.test(value);
    if (!isValidId) return {};
    switch (type) {
      case "is": return { [path]: { equals: value } };
      case "is_not": return { [path]: { not: { equals: value } } };
      case "contains": return { [path]: { some: { id: { equals: value } } } };
      case "not_contains": return { [path]: { none: { id: { equals: value } } } };
      default: return {};
    }
  },
};