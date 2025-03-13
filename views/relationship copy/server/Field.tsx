import { FieldClient } from "../client";
import { fetchRelationshipData } from "./utils";
import { FieldProps } from "../types";

export async function Field({ field, value, onChange }: FieldProps) {
  const relationshipData = await fetchRelationshipData(field, value);

  return (
    <FieldClient
      field={field}
      value={value}
      onChange={onChange}
      initialData={relationshipData}
    />
  );
} 