/**
 * Type definitions for the voice agent context system
 */

export interface GitHubCommit {
  id: string
  sha: string
  message: string
  author: string
  date: string
  timeAgo: string
  url: string
  repo?: string
}

export interface GitHubPullRequest {
  id: number
  number: number
  title: string
  author: string
  state: 'open' | 'closed'
  merged: boolean
  date: string
  timeAgo: string
  url: string
  repo?: string
}

export interface GitHubIssue {
  id: number
  number: number
  title: string
  author: string
  state: 'open' | 'closed'
  date: string
  timeAgo: string
  url: string
  labels: string[]
  repo?: string
}

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end?: string
  time: string
  date: string
  description?: string
  location?: string
  isToday: boolean
  attendees?: string[]
}

export interface EmailThread {
  id: string
  subject: string
  from: string
  snippet: string
  date: string
  unread: boolean
}

export interface AgentGitHubContext {
  recent_commits: GitHubCommit[]
  pull_requests: GitHubPullRequest[]
  issues: GitHubIssue[]
  repositories: string[] // List of active repos
}

export interface AgentCalendarContext {
  past_events: CalendarEvent[] // Last 24 hours
  upcoming_events: CalendarEvent[] // Next 7 days
  today_count: number
  week_count: number
}

export interface AgentEmailContext {
  unread_count: number
  recent_threads: EmailThread[]
}

/**
 * Complete context packet for the voice agent
 */
export interface AgentContext {
  user: {
    id: string
    email?: string
  }
  timestamp: string // ISO timestamp when context was generated
  github?: AgentGitHubContext
  calendar?: AgentCalendarContext
  email?: AgentEmailContext
  summary: string // Natural language summary for the agent
  services_connected: string[] // List of connected services
}

/**
 * Result from context building
 */
export interface ContextBuildResult {
  success: boolean
  context?: AgentContext
  error?: string
}
