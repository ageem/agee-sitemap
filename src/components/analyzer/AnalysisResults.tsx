import { useState } from 'react'
import { AnalysisResult } from '@/types/analysis'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageResultItem } from './PageResultItem'
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react'

interface AnalysisResultsProps {
  results: AnalysisResult | null
}

export function AnalysisResults({ results }: AnalysisResultsProps) {
  const [searchQuery, setSearchQuery] = useState('')

  if (!results) return null

  const filteredPages = results.pages.filter(page => 
    page.title.text.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="divide-y">
      {/* Summary Cards */}
      <div className="p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-50 border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{results.summary.totalPages}</div>
                  <div className="text-sm text-muted-foreground">Total Pages</div>
                </div>
                <div className="text-muted-foreground opacity-20">
                  <AlertCircle className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-50 border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{results.summary.averageScore.toFixed(0)}</div>
                  <div className="text-sm text-muted-foreground">Average Score</div>
                </div>
                <div className="text-blue-500 opacity-20">
                  <CheckCircle className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-red-500">{results.summary.criticalIssues}</div>
                  <div className="text-sm text-muted-foreground">Critical Issues</div>
                </div>
                <div className="text-red-500 opacity-20">
                  <AlertCircle className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-yellow-500">{results.summary.warnings}</div>
                  <div className="text-sm text-muted-foreground">Warnings</div>
                </div>
                <div className="text-yellow-500 opacity-20">
                  <AlertTriangle className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Input
            type="search"
            placeholder="Search pages by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sm:max-w-sm"
          />
          <div className="text-sm text-muted-foreground">
            {filteredPages.length} pages found
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="divide-y">
        {filteredPages.map((page, index) => (
          <PageResultItem key={index} page={page} />
        ))}
      </div>
    </div>
  )
}
