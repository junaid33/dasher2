// Relationship/client/Field.js
"use client";

import { MultipleSelector } from "@/components/ui/multi-select";
import { fetchGraphQL } from "@/lib/graphql";
import { getGqlNames } from "@/lib/get-names-from-list";
import { Option, FieldProps, Field } from "../server";

export default function ClientField({
  options,
  selectedOptions,
  searchFields,
  plural,
  many,
  refLabelField,
  onChange,
  field,
  value,
}: {
  options: Option[];
  selectedOptions: Option[];
  searchFields: string[];
  plural: string;
  many: boolean;
  refLabelField: string;
  onChange?: FieldProps["onChange"];
  field: Field;
  value?: FieldProps["value"];
}) {
  return (
    <MultipleSelector
      value={selectedOptions}
      onChange={(newValues) => {
        if (onChange) {
          const newValue = many
            ? newValues.map((v) => ({ 
                id: v.value,
                [refLabelField]: v.label
              }))
            : newValues[0]
            ? { 
                id: newValues[0].value,
                [refLabelField]: newValues[0].label
              }
            : null;
          onChange({
            value: newValue,
            initial: value?.initial,
            kind: value?.kind || "update",
          });
        }
      }}
      options={options}
      placeholder="Search..."
      maxSelected={many ? undefined : 1}
      onSearch={async (searchValue) => {
        const gqlNames = getGqlNames({
          listKey: field.fieldMeta.refListKey,
          pluralGraphQLName: plural,
        });
        const query = `
          query ($search: String!) {
            items: ${gqlNames.listQueryName}(
              where: {
                OR: [
                  ${searchFields.map((field) => `{ ${field}: { contains: $search } }`).join(",")}
                ]
              },
              take: 100
            ) {
              id
              ${refLabelField}
            }
          }
        `;
        try {
          const data = await fetchGraphQL(query, { search: searchValue });
          return (data?.items || []).map((item: any) => ({
            value: item.id,
            label: item[refLabelField] || item.id || "Unknown",
          }));
        } catch (error) {
          console.error("Search failed:", error);
          return [];
        }
      }}
    />
  );
}