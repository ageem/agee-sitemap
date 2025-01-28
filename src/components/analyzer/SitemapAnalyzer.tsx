import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/supabase-client';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { AnalysisResults } from './AnalysisResults';
import { AnalysisResult, PageAnalysis } from '@/types/analysis';
import {
  Alert,
  AlertDescription
} from "@/components/ui/alert";
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
      const urls = await SitemapService.fetchSitemap(selectedSitemap);
      if (!urls.length) {
        throw new Error('No URLs found in sitemap');
      }

      // Step 2: Analyze each URL
      const analysisResults: PageAnalysis[] = [];
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        try {
          const analysis = await PageAnalyzerService.analyzePage(url);
          analysisResults.push(analysis);
          setProgress((i + 1) / urls.length * 100);
        } catch (error) {
          console.error('Error analyzing URL:', url, error);
          // Continue with other URLs even if one fails
        }
      }

      // Calculate summary statistics
      const criticalIssues = analysisResults.reduce((sum, page) => 
        sum + page.issues.filter(i => i.type === 'error').length, 0
      );
      
      const warnings = analysisResults.reduce((sum, page) => 
        sum + page.issues.filter(i => i.type === 'warning').length, 0
      );

      const averageScore = analysisResults.reduce((sum, page) => sum + page.score, 0) / analysisResults.length;

      // Step 3: Save results
      const result: AnalysisResult = {
        pages: analysisResults,
        summary: {
          totalPages: urls.length,
          criticalIssues,
          warnings,
          averageScore
        }
      };

      setResults(result);

      // Step 4: Save to history if user is logged in
      if (user) {
        await HistoryService.saveToHistory(result, user, selectedSitemap);
        queryClient.invalidateQueries({ queryKey: ['analysisHistory'] });
      }

      toast({
        title: 'Analysis Complete',
        description: `Analyzed ${analysisResults.length} pages from sitemap`,
      });
    } catch (error) {
      console.error('Error during analysis:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          type="url"
          placeholder="Enter sitemap URL"
          value={selectedSitemap}
          onChange={(e) => setSelectedSitemap(e.target.value)}
          disabled={analyzing}
        />
        <Button onClick={analyzeSitemap} disabled={!selectedSitemap || analyzing}>
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
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground">
            Analyzing pages... {Math.round(progress)}%
          </p>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results && <AnalysisResults results={results} />}
    </div>
  );
}
