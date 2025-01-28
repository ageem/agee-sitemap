export type IssueType = 'error' | 'warning'

export interface SeoIssue {
  type: IssueType
  message: string
  details?: string
}

export interface ImageAnalysis {
  src: string
  hasAlt: boolean
  altText?: string
  altLength?: number
  width?: string | null
  height?: string | null
}

export interface TitleAnalysis {
  text: string
  length: number
  isOptimal: boolean
  issues: SeoIssue[]
}

export interface DescriptionAnalysis {
  text: string
  length: number
  isOptimal: boolean
  issues: SeoIssue[]
}

export interface PerformanceAnalysis {
  loadTime: number
  issues: SeoIssue[]
}

export interface PageAnalysis {
  url: string
  title: TitleAnalysis
  description: DescriptionAnalysis
  performance: PerformanceAnalysis
  images: string[]
  score: number
  issues: SeoIssue[]
}

export interface AnalysisSummary {
  totalPages: number
  criticalIssues: number
  warnings: number
  averageScore: number
}

export interface AnalysisResult {
  pages: PageAnalysis[]
  summary: AnalysisSummary
}

export interface Analysis {
  id?: string
  user_id: string
  sitemap_url: string
  status: 'completed' | 'failed'
  results: AnalysisResult
  created_at?: string
}
