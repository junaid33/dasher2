// Define types for our admin metadata
export interface Field {
  path: string;
  label: string;
  isOrderable: boolean;
  isFilterable: boolean;
  fieldMeta: any; // This could be more specific if needed
  viewsIndex: number;
  customViewsIndex?: number;
  itemView?: {
    fieldMode?: string;
    fieldPosition?: string;
  };
  listView?: {
    fieldMode?: string;
  };
  createView?: {
    fieldMode?: string;
  };
}

export interface List {
  key: string;
  path: string;
  label: string;
  singular: string;
  plural: string;
  description?: string;
  initialColumns: string[];
  pageSize: number;
  labelField: string;
  fields: Record<string, Field>;
  searchFields: string[];
  gqlNames: Record<string, string>;
}

export interface AdminMeta {
  lists: Record<string, List>;
  listsByPath: Record<string, List>;
} 