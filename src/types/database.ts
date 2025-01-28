export interface User {
  id: string
  email: string
  created_at: string
  last_login: string
  settings: Record<string, any>
}

export interface Analysis {
  id: string
  user_id: string
  sitemap_url: string
  created_at: string
  status: 'completed' | 'failed'
  results: {
    pages: Array<{
      url: string
      title: {
        text: string
        length: number
        isOptimal: boolean
        issues: Array<{
          type: 'error' | 'warning' | 'info' | 'success'
          message: string
          details?: string
        }>
      }
      description: {
        text: string
        length: number
        isOptimal: boolean
        issues: Array<{
          type: 'error' | 'warning' | 'info' | 'success'
          message: string
          details?: string
        }>
      }
      performance: {
        loadTime: number
        issues: Array<{
          type: 'error' | 'warning' | 'info' | 'success'
          message: string
          details?: string
        }>
      }
      score: number
      issues: Array<{
        type: 'error' | 'warning' | 'info' | 'success'
        message: string
        details?: string
      }>
    }>
    summary: {
      totalPages: number
      criticalIssues: number
      warnings: number
      averageScore: number
    }
  }
}

export interface Site {
  id: string
  user_id: string
  domain: string
  last_analyzed: string
  created_at: string
}
