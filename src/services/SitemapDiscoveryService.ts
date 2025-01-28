import { XMLParser } from 'fast-xml-parser';

export interface SitemapLocation {
  url: string;
  type: 'single' | 'index';
  source: 'robots' | 'direct' | 'discovered';
  children?: string[];
}

interface DiscoveryProgress {
  stage: 'robots' | 'common' | 'index' | 'direct';
  currentAttempt: string;
  attemptsMade: number;
  sitemapsFound: number;
}

const COMMON_SITEMAP_PATHS = [
  '/sitemap.xml',
  '/sitemap_index.xml',
  '/sitemaps/sitemap.xml',
  '/wp-sitemap.xml',
  '/sitemap.php',
  '/sitemap.txt'
];

export class SitemapDiscoveryService {
  private parser: XMLParser;
  private proxyBaseUrl: string;

  constructor(proxyBaseUrl: string = 'http://localhost:3003/api/fetch') {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    });
    this.proxyBaseUrl = proxyBaseUrl;
  }

  private normalizeUrl(url: string): string {
    // Remove trailing whitespace
    let normalized = url.trim();
    
    try {
      // If it's a full URL (with protocol), validate and return it
      if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
        const parsedUrl = new URL(normalized);
        return parsedUrl.toString();
      }
      
      // Try with https:// first
      try {
        const httpsUrl = new URL(`https://${normalized}`);
        return httpsUrl.toString();
      } catch {
        // If https fails, try with http://
        const httpUrl = new URL(`http://${normalized}`);
        return httpUrl.toString();
      }
    } catch (error) {
      console.error('URL normalization error:', {
        originalUrl: url,
        normalizedAttempt: normalized,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Invalid URL format: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async fetchWithProxy(url: string): Promise<string> {
    try {
      console.log('Fetching URL:', url);
      const encodedUrl = encodeURIComponent(url);
      const proxyUrl = `${this.proxyBaseUrl}?url=${encodedUrl}`;
      console.log('Proxy URL:', proxyUrl);
      
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        const error = new Error(`Failed to fetch ${url}: ${response.statusText}`);
        console.error('Fetch error:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          proxyUrl: proxyUrl,
          errorText: errorText
        });
        throw error;
      }
      
      const text = await response.text();
      return text;
    } catch (error) {
      console.error('Fetch error:', {
        message: error instanceof Error ? error.message : String(error),
        url: url
      });
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to fetch ${url}: ${String(error)}`);
    }
  }

  private async checkRobotsTxt(domain: string): Promise<string[]> {
    try {
      const robotsTxt = await this.fetchWithProxy(`${domain}/robots.txt`);
      const sitemapLines = robotsTxt
        .split('\n')
        .filter(line => line.toLowerCase().trim().startsWith('sitemap:'))
        .map(line => line.split(':').slice(1).join(':').trim())
        .filter(url => url.length > 0)
        .map(url => this.normalizeUrl(url));
      return sitemapLines;
    } catch (error) {
      console.log('No robots.txt found or unable to access it:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  private async validateSitemap(url: string): Promise<SitemapLocation | null> {
    try {
      const content = await this.fetchWithProxy(url);
      
      // Try parsing as XML first
      try {
        const parsed = this.parser.parse(content);
        
        // Check if it's a sitemap index
        if (parsed.sitemapindex && parsed.sitemapindex.sitemap) {
          const sitemaps = Array.isArray(parsed.sitemapindex.sitemap) 
            ? parsed.sitemapindex.sitemap 
            : [parsed.sitemapindex.sitemap];
          
          const children = sitemaps
            .map((s: any) => s.loc)
            .filter((loc: any) => typeof loc === 'string' && loc.length > 0)
            .map((url: string) => this.normalizeUrl(url));
          
          return {
            url,
            type: 'index',
            source: 'discovered',
            children
          };
        }
        
        // Check if it's a regular sitemap
        if (parsed.urlset) {
          return {
            url,
            type: 'single',
            source: 'discovered'
          };
        }
      } catch (xmlError) {
        // If XML parsing fails, check if it's a text sitemap
        if (content.trim().split('\n').some(line => line.trim().startsWith('http'))) {
          return {
            url,
            type: 'single',
            source: 'discovered'
          };
        }
      }
    } catch (error) {
      console.error(`Failed to validate sitemap at ${url}:`, error instanceof Error ? error.message : String(error));
    }
    return null;
  }

  public async discover(
    domain: string,
    onProgress?: (progress: DiscoveryProgress) => void
  ): Promise<SitemapLocation[]> {
    try {
      // Normalize the input URL first
      const normalizedUrl = this.normalizeUrl(domain);
      const sitemaps: SitemapLocation[] = [];
      
      // Step 1: Check if the input is already a sitemap URL
      if (normalizedUrl.toLowerCase().includes('sitemap')) {
        onProgress?.({
          stage: 'direct',
          currentAttempt: normalizedUrl,
          attemptsMade: 0,
          sitemapsFound: 0
        });
        
        const sitemap = await this.validateSitemap(normalizedUrl);
        if (sitemap) {
          sitemap.source = 'direct';
          sitemaps.push(sitemap);
          return sitemaps;
        }
      }
      
      // Extract domain for further checks
      const domainUrl = new URL(normalizedUrl);
      const baseDomain = `${domainUrl.protocol}//${domainUrl.host}`;
      
      // Step 2: Check robots.txt
      onProgress?.({
        stage: 'robots',
        currentAttempt: `${baseDomain}/robots.txt`,
        attemptsMade: 0,
        sitemapsFound: 0
      });
      
      const robotsSitemaps = await this.checkRobotsTxt(baseDomain);
      for (const url of robotsSitemaps) {
        const sitemap = await this.validateSitemap(url);
        if (sitemap) {
          sitemap.source = 'robots';
          sitemaps.push(sitemap);
        }
      }

      // Step 3: Try common locations if no sitemaps found in robots.txt
      if (sitemaps.length === 0) {
        for (const [index, path] of COMMON_SITEMAP_PATHS.entries()) {
          const fullUrl = `${baseDomain}${path}`;
          onProgress?.({
            stage: 'common',
            currentAttempt: fullUrl,
            attemptsMade: index + 1,
            sitemapsFound: sitemaps.length
          });

          const sitemap = await this.validateSitemap(fullUrl);
          if (sitemap) {
            sitemaps.push(sitemap);
            // Break after finding first valid sitemap unless it's an index
            if (sitemap.type === 'single') break;
          }
        }
      }

      // Step 4: Process sitemap indexes
      const indexSitemaps = sitemaps.filter(s => s.type === 'index');
      for (const indexSitemap of indexSitemaps) {
        if (!indexSitemap.children) continue;
        
        for (const [index, childUrl] of indexSitemap.children.entries()) {
          const normalizedChildUrl = this.normalizeUrl(childUrl);
          onProgress?.({
            stage: 'index',
            currentAttempt: normalizedChildUrl,
            attemptsMade: index + 1,
            sitemapsFound: sitemaps.length
          });

          const childSitemap = await this.validateSitemap(normalizedChildUrl);
          if (childSitemap) {
            sitemaps.push(childSitemap);
          }
        }
      }

      return sitemaps;
    } catch (error) {
      console.error('Error during sitemap discovery:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}
