/**
 * Server-side implementation for relationship fields
 */
import { fetchGraphQL } from "@/lib/graphql";
import { getGqlNames } from "@/lib/get-names-from-list";

// Export types used by both client and server components
export interface Option {
  value: string;
  label: string;
}

export interface RelationshipItem {
  id: string;
  label?: string;
  data?: Record<string, any>;
  [key: string]: any;
}

export interface FieldMeta {
  refListKey: string;
  refLabelField?: string;
  many?: boolean;
  plural?: string;
  searchFields?: string[];
}

export interface Field {
  path: string;
  label: string;
  description?: string;
  fieldMeta: FieldMeta;
}

export interface FieldProps {
  field: Field;
  value?: {
    value: RelationshipItem | RelationshipItem[] | null;
    initial?: RelationshipItem | RelationshipItem[] | null;
    kind: "update" | "create";
  };
  onChange?: (value: {
    value: RelationshipItem | RelationshipItem[] | null;
    initial?: RelationshipItem | RelationshipItem[] | null;
    kind: "update" | "create";
  }) => void;
}

// Export utility functions for GraphQL operations
export function getGraphQLSelection(path: string, fieldMeta: FieldMeta) {
  if (fieldMeta?.many) {
    return `
      ${path} {
        id
        ${fieldMeta.refLabelField || "id"}
      }
      ${path}Count
    `;
  }
  return `${path} {
    id
    ${fieldMeta.refLabelField || "id"}
  }`;
}

export function transformFilter(path: string, operator: string, value: string, fieldMeta: FieldMeta) {
  if (value === "null") return { [path]: operator === "is" ? null : { not: null } };
  if (fieldMeta?.many) {
    switch (operator) {
      case "some": return { [path]: { some: { id: { in: value.split(",") } } } };
      case "none": return { [path]: { none: { id: { in: value.split(",") } } } };
      case "every": return { [path]: { every: { id: { in: value.split(",") } } } };
      default: return {};
    }
  }
  switch (operator) {
    case "is": return { [path]: { id: { equals: value } } };
    case "not": return { [path]: { id: { not: { equals: value } } } };
    case "in": return { [path]: { id: { in: value.split(",") } } };
    case "not_in": return { [path]: { id: { notIn: value.split(",") } } };
    default: return {};
  }
}

export function getFilterTypes(fieldMeta: FieldMeta) {
  if (fieldMeta?.many) {
    return {
      some: { label: "Some match", initialValue: "" },
      none: { label: "None match", initialValue: "" },
      every: { label: "All match", initialValue: "" },
    };
  }
  return {
    is: { label: "Is", initialValue: "" },
    not: { label: "Is not", initialValue: "" },
    in: { label: "Is one of", initialValue: "" },
    not_in: { label: "Is not one of", initialValue: "" },
  };
}

interface FilterType {
  label: string;
  initialValue: string;
}

export function formatFilterLabel(operator: string, value: string, fieldMeta: FieldMeta) {
  const filterTypes = getFilterTypes(fieldMeta);
  const filterType = filterTypes[operator as keyof typeof filterTypes] as FilterType | undefined;
  if (!filterType) return "";
  if (value === "null") return operator === "is" ? "is null" : "is not null";
  if (["in", "not_in", "some", "none", "every"].includes(operator)) {
    const ids = value.split(",").map((id) => id.trim());
    return `${filterType.label.toLowerCase()}: [${ids.join(", ")}]`;
  }
  return `${filterType.label.toLowerCase()}: ${value}`;
}

// Note: fetchRelationshipData has been moved to the client component