import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Analysis } from '@/types/database'
import { format } from 'date-fns'
import { ArrowUpIcon, ArrowDownIcon, MinusIcon, ChevronDownIcon, ChevronUpIcon, ExternalLinkIcon } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

interface GroupedAnalyses {
  [domain: string]: Analysis[]
}

function getDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function calculateTrend(analyses: Analysis[]): 'up' | 'down' | 'stable' {
  if (analyses.length < 2) return 'stable';
  
  const sorted = [...analyses].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  const latest = sorted[0].results.summary.averageScore;
  const previous = sorted[1].results.summary.averageScore;
  
  if (latest > previous + 5) return 'up';
  if (latest < previous - 5) return 'down';
  return 'stable';
}

function groupAnalysesByDomain(analyses: Analysis[]): GroupedAnalyses {
  return analyses.reduce((groups: GroupedAnalyses, analysis) => {
    const domain = getDomainFromUrl(analysis.sitemap_url);
    if (!groups[domain]) {
      groups[domain] = [];
    }
    groups[domain].push(analysis);
    return groups;
  }, {});
}

function DomainGroup({ domain, analyses }: { domain: string, analyses: Analysis[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  
  const sortedAnalyses = [...analyses].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  const latestAnalysis = sortedAnalyses[0];
  const trend = calculateTrend(analyses);
  const progress = latestAnalysis.results.summary.averageScore;
  
  const criticalIssues = latestAnalysis.results.summary.criticalIssues;
  const warnings = latestAnalysis.results.summary.warnings;

  const paginatedAnalyses = sortedAnalyses.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );
  
  const totalPages = Math.ceil(sortedAnalyses.length / ITEMS_PER_PAGE);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl">{domain}</CardTitle>
            {trend === 'up' && <ArrowUpIcon className="w-5 h-5 text-green-500" />}
            {trend === 'down' && <ArrowDownIcon className="w-5 h-5 text-red-500" />}
            {trend === 'stable' && <MinusIcon className="w-5 h-5 text-gray-500" />}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </Button>
        </div>
        <CardDescription>
          Last analyzed: {format(new Date(latestAnalysis.created_at), 'PPP')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Overall Score</span>
                <span className="text-sm font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-2 rounded-lg bg-red-50">
              <div className="text-2xl font-bold text-red-600">{criticalIssues}</div>
              <div className="text-sm text-red-600">Critical Issues</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-yellow-50">
              <div className="text-2xl font-bold text-yellow-600">{warnings}</div>
              <div className="text-sm text-yellow-600">Warnings</div>
            </div>
          </div>

          {isExpanded && (
            <div className="border rounded-lg mt-4">
              <ScrollArea className="h-[300px]">
                <div className="px-4"> 
                  <Accordion type="single" collapsible className="w-full">
                    {paginatedAnalyses.map((analysis) => (
                      <AccordionItem key={analysis.id} value={analysis.id} className="border-none">
                        <AccordionTrigger className="text-sm hover:no-underline hover:bg-gray-50 rounded-lg px-4">
                          Analysis from {format(new Date(analysis.created_at), 'PPP')}
                        </AccordionTrigger>
                        <AccordionContent className="px-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Score:</span>
                              <span>{Math.round(analysis.results.summary.averageScore)}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Pages Analyzed:</span>
                              <span>{analysis.results.summary.totalPages}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Issues Found:</span>
                              <span>{analysis.results.summary.criticalIssues + analysis.results.summary.warnings}</span>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full mt-2"
                              onClick={() => window.open(analysis.sitemap_url, '_blank')}
                            >
                              View Sitemap
                              <ExternalLinkIcon className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4 pb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <span className="py-2 px-3 text-sm">
                        Page {page} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function HistoryPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'improving' | 'needs-attention'>('all');

  const { data: history, isLoading } = useQuery({
    queryKey: ['history', user?.id],
    queryFn: async () => {
      if (!user) return [];
      console.log('Fetching history for user:', user.id);
      
      // First, let's count total records
      const { count, error: countError } = await supabase
        .from('analysis_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
        
      console.log('Total records in database:', count);
      
      if (countError) {
        console.error('Error counting records:', countError);
      }

      const { data, error } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching history:', error);
        throw error;
      }
      
      console.log('Fetched records:', data?.length);
      console.log('Record timestamps:', data?.map(d => ({
        id: d.id,
        url: d.sitemap_url,
        created: new Date(d.created_at).toISOString()
      })));
      
      return data as Analysis[];
    },
    enabled: !!user,
    refetchInterval: 5000, // Refetch every 5 seconds while component is mounted
    staleTime: 0, // Consider data stale immediately
    cacheTime: 0 // Don't cache the data
  });

  if (!user) {
    return (
      <div className="container p-6 mx-auto">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Sign in to View History</h2>
              <p className="text-gray-500 mb-4">
                Track your SEO progress and view historical analyses by signing in to your account.
              </p>
              <Button asChild>
                <a href="/login">Sign In</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container p-6 mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            Loading history...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!history?.length) {
    return (
      <div className="container p-6 mx-auto">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">No Analysis History</h2>
              <p className="text-gray-500 mb-4">
                You haven't analyzed any sitemaps yet. Start by analyzing your first sitemap!
              </p>
              <Button asChild>
                <a href="/">Analyze Sitemap</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const groupedAnalyses = groupAnalysesByDomain(history);
  const domains = Object.entries(groupedAnalyses)
    .filter(([domain]) => 
      domain.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(([_, analyses]) => {
      const trend = calculateTrend(analyses);
      if (selectedTab === 'improving') return trend === 'up';
      if (selectedTab === 'needs-attention') return trend === 'down';
      return true;
    })
    .sort((a, b) => {
      const aScore = a[1][0].results.summary.averageScore;
      const bScore = b[1][0].results.summary.averageScore;
      return bScore - aScore;
    });

  return (
    <div className="container p-6 mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analysis History</h1>
        <p className="text-gray-500">
          Track your SEO progress and compare results over time.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search domains..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="improving">Improving</TabsTrigger>
              <TabsTrigger value="needs-attention">Needs Attention</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {domains.map(([domain, analyses]) => (
            <DomainGroup key={domain} domain={domain} analyses={analyses} />
          ))}
        </div>
      </div>
    </div>
  );
}
