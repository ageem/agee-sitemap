import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/supabase-client';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { AnalysisResults } from './AnalysisResults';
import { SitemapDiscoveryService, SitemapLocation } from '@/services/SitemapDiscoveryService';
import { AnalysisResult, PageAnalysis } from '@/types/analysis';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User } from '@supabase/supabase-js';
import { SitemapService } from '@/services/SitemapService';
import { PageAnalyzerService } from '@/services/PageAnalyzerService';
import { HistoryService } from '@/services/HistoryService';

export function SitemapAnalyzer() {
  const [selectedSitemap, setSelectedSitemap] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [sitemaps, setSitemaps] = useState<SitemapLocation[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set up auth listener
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const analyzeSitemap = async () => {
    try {
      console.log('Starting sitemap analysis for:', selectedSitemap);
      setAnalyzing(true);
      setError(null);
      setProgress(0);

      // Step 1: Get URLs from sitemap
      const urls = await SitemapService.analyzeSitemap(selectedSitemap, setProgress);
      
      // Step 2: Analyze each page
      const pages = await PageAnalyzerService.analyzePages(urls, setProgress);

      // Step 3: Calculate summary statistics
      const criticalIssues = pages.reduce((sum, page) => 
        sum + page.issues.filter(i => i.type === 'error').length, 0
      );
      
      const warnings = pages.reduce((sum, page) => 
        sum + page.issues.filter(i => i.type === 'warning').length, 0
      );

      const analysisResults: AnalysisResult = {
        pages,
        summary: {
          totalPages: pages.length,
          criticalIssues,
          warnings,
          averageScore: pages.reduce((sum, page) => sum + page.score, 0) / pages.length
        }
      };

      console.log('Setting results and saving to history...');
      setResults(analysisResults);
      
      if (user) {
        console.log('User authenticated, attempting to save to history');
        try {
          await HistoryService.saveToHistory(analysisResults, user, selectedSitemap);
          queryClient.invalidateQueries({ queryKey: ['history'] });
          toast({
            title: 'Analysis Complete',
            description: 'Results have been saved to history.',
          });
        } catch (error) {
          console.error('Failed to save to history:', error);
          toast({
            title: 'Error Saving Results',
            description: 'Analysis completed but could not save to history.',
            variant: 'destructive'
          });
        }
      } else {
        console.log('No user logged in, skipping history save');
        toast({
          title: 'Analysis Complete',
          description: 'Sign in to save results to history.',
          variant: 'default'
        });
      }
      
    } catch (error) {
      console.error('Error analyzing sitemap:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSitemap) return;
    await analyzeSitemap();
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Sitemap Analyzer</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4">
          <Input
            type="text"
            placeholder="Enter sitemap URL"
            value={selectedSitemap}
            onChange={(e) => setSelectedSitemap(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={analyzing || !selectedSitemap}>
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze'
            )}
          </Button>
        </div>

        {analyzing && (
          <Progress value={progress} className="w-full" />
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </form>

      {results && <AnalysisResults results={results} />}

      {!user && (
        <div className="p-4 rounded-lg bg-muted">
          <p className="mb-2 text-sm text-muted-foreground">
            Sign in to save your analysis history and access it later.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
