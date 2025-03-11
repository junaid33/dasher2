/**
 * Field type registry
 * This file manages the registration and access to field types
 */

import * as textClient from "./text/client"
import * as textServer from "./text/server"
import * as selectClient from "./select/client"
import * as selectServer from "./select/server"
import * as integerClient from "./integer/client"
import * as integerServer from "./integer/server"
import * as timestampClient from "./timestamp/client"
import * as timestampServer from "./timestamp/server"
import * as floatClient from "./float/client"
import * as floatServer from "./float/server"
import * as idClient from "./id/client"
import * as idServer from "./id/server"
import * as jsonClient from "./json/client"
import * as jsonServer from "./json/server"
import * as passwordClient from "./password/client"
import * as passwordServer from "./password/server"
import * as virtualClient from "./virtual/client"
import * as virtualServer from "./virtual/server"
import * as relationshipClient from "./relationship/client"
import * as relationshipServer from "./relationship/server"
import * as imageClient from "./image/client"
import * as imageServer from "./image/server"
import * as documentClient from "./document/client"
import * as documentServer from "./document/server"
import * as checkboxClient from "./checkbox/client"
import * as checkboxServer from "./checkbox/server"

// Map of field types to their implementations
export const fieldTypes = {
  text: {
    client: textClient,
    server: textServer,
  },
  select: {
    client: selectClient,
    server: selectServer,
  },
  integer: {
    client: integerClient,
    server: integerServer,
  },
  timestamp: {
    client: timestampClient,
    server: timestampServer,
  },
  float: {
    client: floatClient,
    server: floatServer,
  },
  id: {
    client: idClient,
    server: idServer,
  },
  json: {
    client: jsonClient,
    server: jsonServer,
  },
  password: {
    client: passwordClient,
    server: passwordServer,
  },
  virtual: {
    client: virtualClient,
    server: virtualServer,
  },
  relationship: {
    client: relationshipClient,
    server: relationshipServer,
  },
  image: {
    client: imageClient,
    server: imageServer,
  },
  document: {
    client: documentClient,
    server: documentServer,
  },
  checkbox: {
    client: checkboxClient,
    server: checkboxServer,
  },
  // Add other field types here as they are implemented
}

// Get server-side implementation for a field type
export function getServerField(fieldType) {
  return fieldTypes[fieldType]?.server
}

// Get client-side implementation for a field type
export function getClientField(fieldType) {
  return fieldTypes[fieldType]?.client
}

// Get the field type from a field's viewsIndex
export function getFieldTypeFromViewsIndex(viewsIndex) {
  const viewsIndexToType = {
    0: "id",
    1: "virtual",
    2: "text",
    3: "checkbox",
    4: "json",
    5: "relationship",
    6: "timestamp",
    7: "select",
    8: "integer",
    9: "image",
    10: "float",
    11: "document",
    12: "password",
  }

  return viewsIndexToType[viewsIndex] || "text"
}

