import { AnalysisResult } from '@/types/analysis';
import { supabase } from '@/lib/supabase/supabase-client';
import { User } from '@supabase/supabase-js';

export class HistoryService {
  static async saveToHistory(results: AnalysisResult, user: User, sitemapUrl: string) {
    try {
      if (!user) {
        console.error('Cannot save to history: No user logged in');
        return;
      }

      console.log('Starting save to history:', {
        userId: user.id,
        sitemap: sitemapUrl,
        resultsSize: JSON.stringify(results).length
      });

      // Check if the analysis already exists
      const { data: existing, error: existingError } = await supabase
        .from('analysis_history')
        .select('id, created_at')
        .eq('user_id', user.id)
        .eq('sitemap_url', sitemapUrl)
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingError) {
        console.error('Error checking existing analysis:', existingError);
        throw existingError;
      }

      console.log('Existing analysis check:', {
        found: existing?.length > 0,
        existing
      });

      // If an analysis exists and was created less than 1 minute ago, skip
      if (existing && existing.length > 0) {
        const lastAnalysis = new Date(existing[0].created_at);
        const timeSinceLastAnalysis = Date.now() - lastAnalysis.getTime();
        
        console.log('Time since last analysis:', {
          lastAnalysis,
          timeSinceLastAnalysis,
          skipSave: timeSinceLastAnalysis < 60000
        });

        if (timeSinceLastAnalysis < 60000) {
          console.log('Skipping save - analysis exists within last minute');
          return;
        }
      }

      // Save the new analysis
      const { data, error } = await supabase
        .from('analysis_history')
        .insert([
          {
            user_id: user.id,
            sitemap_url: sitemapUrl,
            results,
            status: 'completed'
          }
        ])
        .select();

      if (error) {
        console.error('Error saving analysis:', error);
        throw error;
      }

      console.log('Successfully saved analysis:', data);
      return data[0];
      
    } catch (error) {
      console.error('Failed to save analysis:', error);
      throw error;
    }
  }
}
