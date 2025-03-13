// Relationship/client/Field.js
"use client";

import { MultipleSelector } from "@/components/ui/multi-select";
import { fetchGraphQL } from "@/lib/graphql";
import { getGqlNames } from "@/lib/get-names-from-list";
import { Option, FieldProps, Field } from "../server";
import { useState } from "react";

// Define a CustomOption type that can handle React nodes as labels
interface CustomOption {
  value: string;
  label: React.ReactNode;
  data?: any;
}

// Create a component that wraps MultipleSelector and handles our CustomOption type
function CustomMultiSelector({ 
  value, 
  onChange, 
  options, 
  ...rest 
}: { 
  value: CustomOption[]; 
  onChange: (value: CustomOption[]) => void; 
  options: Option[];
  [key: string]: any;
}) {
  // Convert CustomOption[] to Option[] for internal component usage
  const stringLabels = options.map(option => ({
    value: option.value,
    label: typeof option.label === 'string' ? option.label : option.value
  }));

  return (
    <MultipleSelector
      // @ts-ignore - We're handling the type conversion ourselves
      value={value}
      onChange={onChange}
      options={stringLabels}
      {...rest}
    />
  );
}

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
  selectedOptions: CustomOption[];
  searchFields: string[];
  plural: string;
  many: boolean;
  refLabelField: string;
  onChange?: FieldProps["onChange"];
  field: Field;
  value?: FieldProps["value"];
}) {
  const [isSearching, setIsSearching] = useState(false);

  return (
    <CustomMultiSelector
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
      placeholder={isSearching ? "Searching..." : "Search..."}
      maxSelected={many ? undefined : 1}
      onSearch={(searchValue: string) => {
        if (!searchValue || searchValue.length < 2) {
          return Promise.resolve(options);
        }
        
        setIsSearching(true);
        
        const gqlNames = getGqlNames({
          listKey: field.fieldMeta.refListKey,
          pluralGraphQLName: plural,
        });
        
        // Only search if we have search fields
        if (!searchFields || searchFields.length === 0) {
          setIsSearching(false);
          return Promise.resolve(options);
        }
        
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

        return fetchGraphQL(query, {
          search: searchValue,
        }).then(({ data }) => {
          setIsSearching(false);
          return (
            data?.items?.map((item: any) => ({
              value: item.id,
              label: item[refLabelField] || item.id,
            })) || []
          );
        }).catch(err => {
          setIsSearching(false);
          console.error("Error searching for options:", err);
          return options;
        });
      }}
      loadingIndicator={isSearching ? <div className="p-2 text-center text-sm text-muted-foreground">Searching...</div> : undefined}
      emptyIndicator={<div className="p-2 text-center text-sm text-muted-foreground">No options found</div>}
    />
  );
}