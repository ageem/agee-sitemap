import { PageAnalysis } from '@/types/analysis';
import { analyzeTitleTag, analyzeMetaDescription, analyzeLoadTime, calculateSeoScore } from '@/utils/seoAnalysis';
import { ProxyService } from './ProxyService';
import { JSDOM } from 'jsdom';

interface ImageAnalysis {
  src: string;
  hasAlt: boolean;
  altText?: string;
  width: number | null;
  height: number | null;
}

export class PageAnalyzerService {
  static async analyzePage(pageUrl: string): Promise<PageAnalysis> {
    try {
      console.log('Analyzing page:', pageUrl);
      const startTime = performance.now();
      
      const html = await ProxyService.fetch(pageUrl);
      const loadTime = performance.now() - startTime;
      
      // Try to extract title and meta description from HTML if we got HTML response
      let title = '';
      let description = '';
      let images: ImageAnalysis[] = [];
      
      if (html.includes('<!DOCTYPE html>') || html.includes('<html')) {
        const dom = new JSDOM(html);
        const doc = dom.window.document;
        
        // Extract title
        const titleElement = doc.querySelector('title');
        title = titleElement?.textContent || '';
        
        // Extract meta description
        const metaDesc = doc.querySelector('meta[name="description"]');
        description = metaDesc?.getAttribute('content') || '';

        // Extract images
        const imageElements = doc.querySelectorAll('img');
        images = Array.from(imageElements).map((img: HTMLImageElement) => ({
          src: img.getAttribute('src') || '',
          hasAlt: img.hasAttribute('alt'),
          altText: img.getAttribute('alt') || undefined,
          width: img.getAttribute('width') ? parseInt(img.getAttribute('width') || '0') : null,
          height: img.getAttribute('height') ? parseInt(img.getAttribute('height') || '0') : null
        }));
      }
      
      const titleAnalysis = analyzeTitleTag(title);
      const descriptionAnalysis = analyzeMetaDescription(description);
      const performanceAnalysis = analyzeLoadTime(loadTime);
      
      // Analyze each image
      const imageAnalyses = images.map(img => ({
        src: img.src,
        hasAlt: img.hasAlt,
        altText: img.altText,
        width: img.width,
        height: img.height
      }));

      // Create analysis objects for score calculation
      const analysisObjects = [
        { issues: titleAnalysis.issues },
        { issues: descriptionAnalysis.issues },
        { issues: performanceAnalysis.issues }
      ];

      // Add image issues if any images are missing alt text
      if (images.length > 0) {
        const missingAltImages = images.filter(img => !img.hasAlt);
        if (missingAltImages.length > 0) {
          analysisObjects.push({
            issues: [{
              type: 'warning',
              message: `${missingAltImages.length} images are missing alt text`
            }]
          });
        }
      }

      // Calculate overall score
      const score = calculateSeoScore(analysisObjects);

      // Combine all issues
      const issues = [
        ...titleAnalysis.issues,
        ...descriptionAnalysis.issues,
        ...performanceAnalysis.issues
      ];

      return {
        url: pageUrl,
        title: titleAnalysis,
        description: descriptionAnalysis,
        performance: performanceAnalysis,
        images: imageAnalyses,
        score,
        issues
      };
    } catch (error) {
      console.error('Error analyzing page:', error);
      throw error;
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
