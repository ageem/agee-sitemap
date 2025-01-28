import { useState } from 'react'
import { PageAnalysis, SeoIssue } from '@/types/analysis'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react'

interface PageResultItemProps {
  page: PageAnalysis
}

function IssueIcon({ type }: { type: SeoIssue['type'] }) {
  switch (type) {
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />
  }
}

export function PageResultItem({ page }: PageResultItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const criticalCount = page.issues.filter(i => i.type === 'error').length
  const warningCount = page.issues.filter(i => i.type === 'warning').length

  return (
    <div className="border rounded-lg shadow-sm bg-white">
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{page.title.text || 'Untitled Page'}</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {criticalCount > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 whitespace-nowrap">
                {criticalCount} {criticalCount === 1 ? 'Error' : 'Errors'}
              </span>
            )}
            {warningCount > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 whitespace-nowrap">
                {warningCount} {warningCount === 1 ? 'Warning' : 'Warnings'}
              </span>
            )}
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 whitespace-nowrap">
              Score: {page.score}
            </span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t bg-gray-50 space-y-4">
          <div className="text-sm text-gray-500 break-all">
            {page.url}
          </div>

          <div className="grid gap-6">
            {/* Title Analysis */}
            <div className="space-y-2">
              <div className="text-sm font-medium flex items-center justify-between">
                <span>Title Tag</span>
                <span className="text-xs text-gray-500">
                  {page.title.length} characters (recommended: 30-60)
                </span>
              </div>
              
              <div className="bg-white p-3 rounded border">
                {page.title.text ? (
                  <p className="text-sm font-mono">{page.title.text}</p>
                ) : (
                  <p className="text-sm text-red-500 italic">No title tag found</p>
                )}
              </div>

              <Progress 
                value={(page.title.length / 60) * 100} 
                className="h-1"
              />
              
              <div className="space-y-1">
                {page.title.issues.map((issue, i) => (
                  <div key={i} className="flex items-center space-x-2 text-sm">
                    <IssueIcon type={issue.type} />
                    <span>{issue.message}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Description Analysis */}
            <div className="space-y-2">
              <div className="text-sm font-medium flex items-center justify-between">
                <span>Meta Description</span>
                <span className="text-xs text-gray-500">
                  {page.description.length} characters (recommended: 120-160)
                </span>
              </div>

              <div className="bg-white p-3 rounded border">
                {page.description.text ? (
                  <p className="text-sm font-mono">{page.description.text}</p>
                ) : (
                  <p className="text-sm text-red-500 italic">No meta description found</p>
                )}
              </div>

              <Progress 
                value={(page.description.length / 160) * 100} 
                className="h-1"
              />
              
              <div className="space-y-1">
                {page.description.issues.map((issue, i) => (
                  <div key={i} className="flex items-center space-x-2 text-sm">
                    <IssueIcon type={issue.type} />
                    <span>{issue.message}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Images */}
            {page.images.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium flex items-center justify-between">
                  <span>Images</span>
                  <span className="text-xs text-gray-500">
                    {page.images.filter(img => img.hasAlt).length} of {page.images.length} have alt text
                  </span>
                </div>
                <div className="space-y-2">
                  {page.images.map((image, i) => (
                    <div key={i} className="bg-white p-3 rounded border space-y-2">
                      <div className="flex items-start space-x-2">
                        {image.hasAlt ? (
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-1" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-1" />
                        )}
                        <div className="space-y-1 min-w-0 flex-1">
                          <p className="text-sm font-mono break-all">{image.src}</p>
                          {image.hasAlt ? (
                            <div className="text-sm">
                              <span className="text-gray-500">Alt text: </span>
                              <span className="font-mono">{image.altText}</span>
                            </div>
                          ) : (
                            <p className="text-sm text-red-500">Missing alt text</p>
                          )}
                          {(image.width || image.height) && (
                            <div className="text-xs text-gray-500">
                              Dimensions: {image.width || '?'}×{image.height || '?'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Performance</div>
              <div className="space-y-1">
                {page.performance.issues.map((issue, i) => (
                  <div key={i} className="flex items-center space-x-2 text-sm">
                    <IssueIcon type={issue.type} />
                    <span>{issue.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
