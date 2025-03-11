import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchGraphQL } from "@/lib/graphql"

export default async function Home() {
  // Fetch lists from the GraphQL API
  const data = await fetchGraphQL(`
    query {
      keystone {
        adminMeta {
          lists {
            key
            path
            label
            singular
            plural
          }
        }
      }
    }
  `)

  const lists = data.keystone.adminMeta.lists

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-screen-2xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight mb-6">Admin Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list: any) => (
            <Card key={list.key}>
              <CardHeader>
                <CardTitle>{list.label}</CardTitle>
                <CardDescription>Manage {list.plural.toLowerCase()}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/${list.path}`} passHref>
                  <Button className="w-full">View {list.plural}</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

