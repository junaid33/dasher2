import { Suspense } from "react";
import { fetchGraphQL } from "@/lib/graphql";
import { getGqlNames } from "@/lib/get-names-from-list";

async function FetchLabel({
  id,
  listKey,
  labelField,
}: {
  id: string;
  listKey: string;
  labelField: string;
}) {
  // First, fetch the list metadata to get the proper singular and plural values
  const metaQuery = `
    query {
      keystone {
        adminMeta {
          list(key: "${listKey}") {
            singular
            plural
          }
        }
      }
    }
  `;
  
  const metaData = await fetchGraphQL(metaQuery);
  const { plural } = metaData.keystone.adminMeta.list;
  
  // Now use getGqlNames with the correct plural name
  const gqlNames = getGqlNames({
    listKey,
    pluralGraphQLName: plural
  });
  
  const query = `
    query ($id: ID!) {
      item: ${gqlNames.itemQueryName}(where: { id: $id }) {
        id
        ${labelField}
      }
    }
  `;

  // Execute the query
  const data = await fetchGraphQL(query, { id });
  const label = data?.item?.[labelField];

  if (!label) return null;
  return <>{label}</>;
}

export default function SelectedOptionLabel({
  id,
  listKey,
  labelField = "id",
}: {
  id: string;
  listKey: string;
  labelField?: string;
}) {
  return (
    <Suspense fallback={id}>
      <FetchLabel id={id} listKey={listKey} labelField={labelField} />
    </Suspense>
  );
} 