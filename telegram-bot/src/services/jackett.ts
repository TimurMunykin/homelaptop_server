import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { ServiceStatus } from '../types';

export interface JackettSearchResult {
  title: string;
  link: string;
  size: number;
  seeders: number;
  peers: number;
  publishDate: string;
  categoryDesc: string;
  tracker: string;
}

export interface JackettIndexer {
  id: string;
  name: string;
  description: string;
  language: string;
  type: string;
  configured: boolean;
}

export class JackettService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.services.jackett.url,
      timeout: 30000,
    });
  }

  async checkStatus(): Promise<ServiceStatus> {
    try {
      const startTime = Date.now();
      // Just check if HTTP server responds
      const response = await this.client.get('/', {
        maxRedirects: 0, // Don't follow redirects
        validateStatus: (status) => status < 400, // Accept redirects as success
      });
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'Jackett',
        status: 'online',
        message: `HTTP server accessible (${response.status === 301 ? 'redirects to dashboard' : 'direct access'})`,
        responseTime,
      };
    } catch (error) {
      // Handle redirect as success
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response && (axiosError.response.status === 301 || axiosError.response.status === 302)) {
          const startTime = Date.now();
          const responseTime = Date.now() - startTime;
          
          return {
            name: 'Jackett',
            status: 'online',
            message: 'Web server accessible (redirects to login)',
            responseTime,
          };
        }
      }
      
      return {
        name: 'Jackett',
        status: 'offline',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getIndexers(): Promise<JackettIndexer[]> {
    try {
      // Try API first
      if (config.services.jackett.apiKey) {
        try {
          const response = await this.client.get('/api/v2.0/indexers', {
            params: {
              apikey: config.services.jackett.apiKey,
            },
          });
          
          return response.data.map((indexer: any): JackettIndexer => ({
            id: indexer.id || indexer.name || 'unknown',
            name: indexer.name || indexer.id || 'Unknown',
            description: indexer.description || '',
            language: indexer.language || 'unknown',
            type: indexer.type || 'unknown',
            configured: indexer.configured !== false,
          }));
        } catch (apiError) {
          console.log('API failed, trying HTML parsing...');
        }
      }

      // Fallback to HTML parsing
      const response = await this.client.get('/UI/Dashboard');
      const html = response.data;
      
      // Simple regex to find configured indexers in HTML
      const indexerMatches = html.match(/data-id="([^"]+)"[^>]*class="[^"]*configured[^"]*"/g) || [];
      
      const indexers: JackettIndexer[] = [];
      for (const match of indexerMatches) {
        const idMatch = match.match(/data-id="([^"]+)"/);
        if (idMatch) {
          const id = idMatch[1];
          // Try to extract name from nearby HTML
          const namePattern = new RegExp(`data-id="${id}"[^>]*>.*?<.*?title="([^"]+)"|>${id}</`, 'i');
          const nameMatch = html.match(namePattern);
          const name = nameMatch ? (nameMatch[1] || id) : id;
          
          indexers.push({
            id,
            name: name.replace(/\s+/g, ' ').trim(),
            description: 'Configured tracker',
            language: 'unknown',
            type: 'public',
            configured: true,
          });
        }
      }
      
      return indexers;
    } catch (error) {
      console.error('Failed to get indexers:', error);
      throw error;
    }
  }

  async search(query: string, limit: number = 10): Promise<JackettSearchResult[]> {
    try {
      if (!config.services.jackett.apiKey) {
        throw new Error('Jackett API key is not configured');
      }

      const response = await this.client.get('/api/v2.0/indexers/all/results', {
        params: {
          apikey: config.services.jackett.apiKey,
          Query: query,
          Category: '', // All categories
        },
      });

      const results = response.data.Results || [];
      
      return results
        .slice(0, limit)
        .map((result: any): JackettSearchResult => ({
          title: result.Title || 'Unknown',
          link: result.Link || result.MagnetUri || '',
          size: result.Size || 0,
          seeders: result.Seeders || 0,
          peers: result.Peers || 0,
          publishDate: result.PublishDate || '',
          categoryDesc: result.CategoryDesc || 'Unknown',
          tracker: result.Tracker || 'Unknown',
        }));
    } catch (error) {
      console.error('Jackett search failed:', error);
      throw error;
    }
  }

  async searchByIndexer(indexerId: string, query: string, limit: number = 10): Promise<JackettSearchResult[]> {
    try {
      if (!config.services.jackett.apiKey) {
        throw new Error('Jackett API key is not configured');
      }

      const response = await this.client.get(`/api/v2.0/indexers/${indexerId}/results`, {
        params: {
          apikey: config.services.jackett.apiKey,
          Query: query,
          Category: '',
        },
      });

      const results = response.data.Results || [];
      
      return results
        .slice(0, limit)
        .map((result: any): JackettSearchResult => ({
          title: result.Title || 'Unknown',
          link: result.Link || result.MagnetUri || '',
          size: result.Size || 0,
          seeders: result.Seeders || 0,
          peers: result.Peers || 0,
          publishDate: result.PublishDate || '',
          categoryDesc: result.CategoryDesc || 'Unknown',
          tracker: result.Tracker || 'Unknown',
        }));
    } catch (error) {
      console.error(`Jackett search by indexer ${indexerId} failed:`, error);
      throw error;
    }
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  formatSearchResult(result: JackettSearchResult, index: number): string {
    const size = this.formatSize(result.size);
    const title = result.title.length > 50 ? result.title.substring(0, 47) + '...' : result.title;
    
    return `${index + 1}. ${title}\n` +
           `📁 ${size} | 🌱 ${result.seeders} | 👥 ${result.peers}\n` +
           `🔍 ${result.tracker} | 📂 ${result.categoryDesc}\n` +
           `🔗 ${result.link}`;
  }
}