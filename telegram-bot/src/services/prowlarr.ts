import axios, { AxiosInstance } from 'axios';
import { config } from '../config';

export interface ServiceStatus {
  name: string;
  status: 'online' | 'offline';
  message?: string;
  responseTime?: number;
}

export interface IndexerResult {
  title: string;
  downloadUrl: string;
  seeders: number;
  leechers: number;
  size: string;
  publishDate: string;
  category: string;
}

export interface ProwlarrIndexer {
  id: number;
  name: string;
  enable: boolean;
  redirect: boolean;
  priority: number;
  description: string;
}

export class ProwlarrService {
  private client: AxiosInstance;
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = config.services.jackett.url;
    this.apiKey = config.services.jackett.apiKey || '';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'X-Api-Key': this.apiKey,
      },
    });
  }

  async checkStatus(): Promise<ServiceStatus> {
    const startTime = Date.now();
    
    try {
      const response = await this.client.get('/api/v1/system/status');
      const responseTime = Date.now() - startTime;
      
      if (response.status === 200) {
        return {
          name: 'Prowlarr',
          status: 'online',
          message: `Version: ${response.data.version}`,
          responseTime,
        };
      }
      
      return {
        name: 'Prowlarr',
        status: 'offline',
        message: `HTTP ${response.status}`,
      };
    } catch (error: any) {
      return {
        name: 'Prowlarr',
        status: 'offline',
        message: error.code || error.message,
      };
    }
  }

  async search(query: string): Promise<IndexerResult[]> {
    try {
      const response = await this.client.get('/api/v1/search', {
        params: {
          query: query,
        },
      });

      return response.data.map((item: any) => ({
        title: item.title,
        downloadUrl: item.magnetUrl || item.guid || '',
        seeders: item.seeders || 0,
        leechers: item.leechers || 0,
        size: this.formatSize(item.size),
        publishDate: new Date(item.publishDate).toLocaleDateString(),
        category: item.categories?.[0]?.name || 'Unknown',
      }));
    } catch (error) {
      console.error('Prowlarr search error:', error);
      return [];
    }
  }

  async getIndexers(): Promise<ProwlarrIndexer[]> {
    try {
      const response = await this.client.get('/api/v1/indexer');
      
      return response.data.map((indexer: any) => ({
        id: indexer.id,
        name: indexer.name || 'Unknown',
        enable: indexer.enable || false,
        redirect: indexer.redirect || false,
        priority: indexer.priority || 0,
        description: indexer.description || '',
      }));
    } catch (error) {
      console.error('Prowlarr getIndexers error:', error);
      return [];
    }
  }

  private formatSize(bytes: number): string {
    if (!bytes) return 'Unknown';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }
}