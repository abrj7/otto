export interface User {
  id: string
  email: string
  name: string | null
  created_at: string
}

export interface Workspace {
  id: string
  name: string
  owner_id: string
  created_at: string
}

export type IntegrationType =
  | 'github'
  | 'slack'
  | 'notion'
  | 'gmail'
  | 'calendar'
  | 'linkedin'
  | 'zoom'

export interface Integration {
  id: string
  workspace_id: string
  type: IntegrationType
  access_token: string | null
  refresh_token: string | null
  metadata: Record<string, unknown> | null
  connected_at: string
}

export interface Repo {
  id: string
  integration_id: string
  external_id: string
  name: string
  full_name: string
  default_branch: string
  last_synced_at: string | null
}

export interface Event {
  id: string
  workspace_id: string
  integration_type: IntegrationType
  event_type: string
  actor: string | null
  title: string | null
  body: string | null
  url: string | null
  metadata: Record<string, unknown> | null
  occurred_at: string
  created_at: string
}

export interface QueryLog {
  id: string
  workspace_id: string
  user_id: string
  query_text: string
  intent: string | null
  response_text: string | null
  input_tokens: number | null
  output_tokens: number | null
  compression_ratio: number | null
  latency_ms: number | null
  created_at: string
}

// API Request/Response Types
export interface QueryRequest {
  query: string
  workspace_id: string
  voice?: boolean
}

export interface Receipt {
  type: 'commit' | 'pr' | 'slack' | 'email' | 'event' | 'issue'
  title: string
  url: string
}

export interface TokenStats {
  input_tokens: number
  output_tokens: number
  compression_ratio: number | null
}

export interface QueryResponse {
  summary: string
  receipts: Receipt[]
  token_stats: TokenStats
  audio_url?: string
}

export interface BriefingSection {
  source: IntegrationType
  items: Event[]
}

export interface BriefingResponse {
  date: string
  summary: string
  sections: BriefingSection[]
  receipts: Receipt[]
  token_stats: TokenStats
}
