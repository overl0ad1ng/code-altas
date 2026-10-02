import "server-only"

export { loadCodeAtlasConfig } from "./server/config"
export { getSiteMetadata, getDocMetadata } from "./server/metadata"
export { flattenDocs, type DocEntry } from "./lib/docs-content"
export {
  DocContentError,
  type DocContentErrorCode,
  loadDocsIndex,
  readDoc,
  type DocExtension,
  type ReadDocResult,
} from "./server/docs-content"
