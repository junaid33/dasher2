import { fetchGraphQL } from "./graphql";
import { List } from "./admin-metadata";
import { getGqlNames } from "./get-names-from-list";

export async function getItem(list: List, id: string) {
  const gqlNames = getGqlNames({listKey: list.key, pluralGraphQLName: list.plural});


  
  const { data } = await fetchGraphQL(
      `query($id: ID!) {
        ${gqlNames.itemQueryName}(where: { id: $id }) {
          id
          ${list.fields.map(field => field.path).join("\n          ")}
        }
      }
    `,
    { id },
  );

  return data[gqlNames.itemQueryName];
} 