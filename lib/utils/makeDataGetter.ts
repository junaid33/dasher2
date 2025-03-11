// Simplified version of Keystone's makeDataGetter utility
export function makeDataGetter(data: any) {
  const get = (path: string) => {
    const parts = path.split(".")
    let value = data

    for (const part of parts) {
      if (value === null || value === undefined) {
        return { data: null, errors: [] }
      }
      value = value[part]
    }

    return { data: value, errors: [] }
  }

  return { get }
}

