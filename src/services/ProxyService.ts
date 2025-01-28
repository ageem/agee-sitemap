// Utility for handling delays
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class ProxyService {
  private static queue: Array<() => Promise<void>> = [];
  private static isProcessing = false;
  private static lastRequestTime = 0;
  private static readonly minRequestInterval = 1000 / (import.meta.env.VITE_RATE_LIMIT || 100); // Default to 100 requests per second

  private static async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (request) {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.minRequestInterval) {
          await wait(this.minRequestInterval - timeSinceLastRequest);
        }
        
        await request();
        this.lastRequestTime = Date.now();
      }
    }
    
    this.isProcessing = false;
  }

  static async fetch(url: string, retries = 2): Promise<string> {
    return new Promise((resolve, reject) => {
      const request = async () => {
        try {
          console.log('Fetching URL:', url);
          const proxyUrl = new URL(import.meta.env.VITE_API_URL + '/api/fetch' || 'http://localhost:3003/api/fetch');
          proxyUrl.searchParams.set('url', url);
          
          console.log('Proxy URL:', proxyUrl.toString());
          
          const response = await fetch(proxyUrl);
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Proxy fetch error:', {
              status: response.status,
              statusText: response.statusText,
              url,
              proxyUrl: proxyUrl.toString(),
              errorText
            });

            if (retries > 0) {
              console.log(`Retrying fetch (${retries} attempts left)...`);
              await wait(1000);
              resolve(await ProxyService.fetch(url, retries - 1));
              return;
            }
            
            throw new Error(`Failed to fetch: ${response.statusText}`);
          }
          
          const contentType = response.headers.get('content-type');
          const text = await response.text();
          
          console.log('Fetch successful:', {
            contentType,
            textLength: text.length,
            url
          });
          
          resolve(text);
        } catch (error) {
          if (retries > 0) {
            console.log(`Retrying fetch after error (${retries} attempts left)...`);
            await wait(1000);
            try {
              const result = await ProxyService.fetch(url, retries - 1);
              resolve(result);
            } catch (retryError) {
              reject(retryError);
            }
            return;
          }
          
          console.error('Fetch error:', {
            error: error instanceof Error ? error.message : String(error),
            url
          });
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      };

      this.queue.push(request);
      this.processQueue();
    });
  }
}
