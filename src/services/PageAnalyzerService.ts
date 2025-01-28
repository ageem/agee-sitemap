import { PageAnalysis } from '@/types/analysis';
import { analyzeTitleTag, analyzeMetaDescription, analyzeLoadTime, calculateSeoScore } from '@/utils/seoAnalysis';
import { ProxyService } from './ProxyService';

export class PageAnalyzerService {
  static async analyzePage(pageUrl: string): Promise<PageAnalysis> {
    try {
      console.log('Analyzing page:', pageUrl);
      const startTime = performance.now();
      
      const response = await ProxyService.fetch(pageUrl);
      const loadTime = performance.now() - startTime;
      
      // Try to extract title and meta description from HTML if we got HTML response
      let title = '';
      let description = '';
      
      if (response.includes('<!DOCTYPE html>') || response.includes('<html')) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(response, 'text/html');
        
        // Extract title
        const titleElement = doc.querySelector('title');
        title = titleElement?.textContent || '';
        
        // Extract meta description
        const metaDesc = doc.querySelector('meta[name="description"]');
        description = metaDesc?.getAttribute('content') || '';
      }
      
      const titleAnalysis = analyzeTitleTag(title);
      const descriptionAnalysis = analyzeMetaDescription(description);
      const performanceAnalysis = analyzeLoadTime(loadTime);
      
      const score = calculateSeoScore([
        titleAnalysis,
        descriptionAnalysis,
        performanceAnalysis
      ]);

      return {
        url: pageUrl,
        title: titleAnalysis,
        description: descriptionAnalysis,
        performance: performanceAnalysis,
        images: [],
        score,
        issues: [
          ...titleAnalysis.issues,
          ...descriptionAnalysis.issues,
          ...performanceAnalysis.issues
        ]
      };
    } catch (error) {
      console.error('Error analyzing page:', {
        url: pageUrl,
        error: error instanceof Error ? error.message : String(error)
      });
      
      return {
        url: pageUrl,
        title: { text: '', length: 0, isOptimal: false, issues: [] },
        description: { text: '', length: 0, isOptimal: false, issues: [] },
        performance: { loadTime: 0, issues: [] },
        images: [],
        score: 0,
        issues: [{
          type: 'error',
          message: 'Failed to analyze page',
          details: error instanceof Error ? error.message : 'Unknown error'
        }]
      };
    }
  }

  static async analyzePages(urls: string[], onProgress: (progress: number) => void): Promise<PageAnalysis[]> {
    const pages: PageAnalysis[] = [];
    let completed = 0;
    const batchSize = 10;
    
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      console.log(`Processing batch ${i/batchSize + 1}/${Math.ceil(urls.length/batchSize)}, size: ${batch.length}`);
      
      const batchResults = await Promise.allSettled(
        batch.map(pageUrl => this.analyzePage(pageUrl))
      );
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          pages.push(result.value);
        }
        completed++;
        onProgress((completed / urls.length) * 100);
      });
      
      // Add a small delay between batches
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return pages;
  }
}
