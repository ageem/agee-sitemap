import { ProxyService } from './ProxyService';

export class SitemapService {
  static extractUrlsFromSitemap(xml: string): string[] {
    try {
      console.log('Raw XML content:', xml.substring(0, 500));
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xml, 'text/xml');
      
      // Find all loc elements (they contain URLs)
      const locNodes = xmlDoc.getElementsByTagName('loc');
      console.log('Found loc nodes:', locNodes.length);
      
      // Convert NodeList to Array and extract URLs
      const urls = Array.from(locNodes).map(node => node.textContent || '').filter(Boolean);
      
      // Log found URLs
      urls.forEach((url, index) => {
        if (index < 5) {
          console.log('Found URL from loc:', url);
        }
      });
      
      if (urls.length > 5) {
        console.log(`... and ${urls.length - 5} more URLs`);
      }
      
      return urls;
    } catch (error) {
      console.error('Error parsing sitemap:', error);
      throw new Error('Failed to parse sitemap XML');
    }
  }

  static async analyzeSitemap(sitemapUrl: string, onProgress: (progress: number) => void): Promise<string[]> {
    const sitemapXml = await ProxyService.fetch(sitemapUrl);
    const urls = this.extractUrlsFromSitemap(sitemapXml);
    
    if (urls.length === 0) {
      throw new Error('No valid URLs found in sitemap');
    }
    
    return urls;
  }
}
