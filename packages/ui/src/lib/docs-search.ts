/** Search responses contain plain text; offsets use JavaScript string indices. */
export interface SearchHighlight {
  start: number
  end: number
}

export interface DocsSearchResult {
  id: string
  title: string
  url: string
  type: "title" | "heading" | "text" | "code"
  heading?: string
  snippet: string
  highlights: SearchHighlight[]
}

export interface DocsSearchResponse {
  results: DocsSearchResult[]
}
