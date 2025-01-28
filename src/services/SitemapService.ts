import { ProxyService } from './ProxyService';
import { XMLParser } from 'fast-xml-parser';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

interface SitemapIndex {
  loc: string;
  lastmod?: string;
}

export class SitemapService {
  static extractUrlsFromSitemap(xml: string): string[] {
    try {
      console.log('Raw XML content:', xml.substring(0, 500));
      
      const parser = new XMLParser();
      const result = parser.parse(xml);
      
      // Handle both urlset (standard sitemap) and sitemapindex (sitemap index)
      const urls: string[] = [];
      
      if (result.urlset?.url) {
        // Standard sitemap
        const urlNodes = Array.isArray(result.urlset.url) ? result.urlset.url : [result.urlset.url];
        urls.push(...urlNodes.map((node: SitemapUrl) => node.loc).filter(Boolean));
      } else if (result.sitemapindex?.sitemap) {
        // Sitemap index
        const sitemaps = Array.isArray(result.sitemapindex.sitemap) 
          ? result.sitemapindex.sitemap 
          : [result.sitemapindex.sitemap];
        urls.push(...sitemaps.map((node: SitemapIndex) => node.loc).filter(Boolean));
      }
      
      // Log found URLs
      urls.forEach((url, index) => {
        if (index < 5) {
          console.log('Found URL:', url);
        }
      });
      
      if (urls.length > 5) {
        console.log(`... and ${urls.length - 5} more URLs`);
      }
      
      return urls;
    } catch (error) {
      console.error('Error parsing sitemap:', error);
      return [];
    }
  }

  static async fetchSitemap(url: string): Promise<string[]> {
    try {
      const xml = await ProxyService.fetch(url);
      return this.extractUrlsFromSitemap(xml);
    } catch (error) {
      console.error('Error fetching sitemap:', error);
      return [];
    }
  }
}
