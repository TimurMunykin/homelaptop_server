import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { ServiceStatus, TorrentInfo } from '../types';

export class QBittorrentService {
  private client: AxiosInstance;
  private cookie: string = '';

  constructor() {
    this.client = axios.create({
      baseURL: config.services.qbittorrent.url,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  async checkStatus(): Promise<ServiceStatus> {
    try {
      const startTime = Date.now();
      const response = await this.client.get('/api/v2/app/version');
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'qBittorrent',
        status: 'online',
        message: `Version: ${response.data}`,
        responseTime,
      };
    } catch (error) {
      return {
        name: 'qBittorrent',
        status: 'offline',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async login(): Promise<boolean> {
    try {
      if (!config.services.qbittorrent.username || !config.services.qbittorrent.password) {
        return true; // No auth required
      }

      const response = await this.client.post('/api/v2/auth/login', new URLSearchParams({
        username: config.services.qbittorrent.username,
        password: config.services.qbittorrent.password,
      }));

      if (response.status === 200) {
        const setCookie = response.headers['set-cookie'];
        if (setCookie) {
          this.cookie = setCookie[0];
          this.client.defaults.headers.Cookie = this.cookie;
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('qBittorrent login failed:', error);
      return false;
    }
  }

  async getTorrents(): Promise<TorrentInfo[]> {
    try {
      await this.login();
      
      const response = await this.client.get('/api/v2/torrents/info');
      
      return response.data.map((torrent: any): TorrentInfo => ({
        hash: torrent.hash,
        name: torrent.name,
        progress: Math.round(torrent.progress * 100),
        dlspeed: torrent.dlspeed,
        upspeed: torrent.upspeed,
        priority: torrent.priority,
        state: torrent.state,
        size: torrent.size,
        completed: torrent.completed,
      }));
    } catch (error) {
      console.error('Failed to get torrents:', error);
      throw error;
    }
  }

  async addTorrent(torrentUrl: string): Promise<boolean> {
    try {
      await this.login();
      
      const formData = new URLSearchParams();
      formData.append('urls', torrentUrl);
      
      const response = await this.client.post('/api/v2/torrents/add', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      return response.status === 200;
    } catch (error) {
      console.error('Failed to add torrent:', error);
      return false;
    }
  }

  async pauseTorrent(hash: string): Promise<boolean> {
    try {
      await this.login();
      const formData = new URLSearchParams();
      formData.append('hashes', hash);
      const response = await this.client.post('/api/v2/torrents/stop', formData);
      return response.status === 200;
    } catch (error) {
      console.error('Failed to pause torrent:', error);
      return false;
    }
  }

  async resumeTorrent(hash: string): Promise<boolean> {
    try {
      await this.login();
      const formData = new URLSearchParams();
      formData.append('hashes', hash);
      const response = await this.client.post('/api/v2/torrents/start', formData);
      return response.status === 200;
    } catch (error) {
      console.error('Failed to resume torrent:', error);
      return false;
    }
  }

  async deleteTorrent(hash: string, deleteFiles: boolean = false): Promise<boolean> {
    try {
      await this.login();
      const formData = new URLSearchParams();
      formData.append('hashes', hash);
      formData.append('deleteFiles', deleteFiles.toString());
      const response = await this.client.post('/api/v2/torrents/delete', formData);
      return response.status === 200;
    } catch (error) {
      console.error('Failed to delete torrent:', error);
      return false;
    }
  }

  async pauseAll(): Promise<boolean> {
    try {
      const params = new URLSearchParams();
      params.append('hashes', 'all');
      
      const response = await this.client.post('/api/v2/torrents/stop', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      return response.status === 200;
    } catch (error) {
      console.error('Failed to pause all torrents:', error);
      return false;
    }
  }

  async resumeAll(): Promise<boolean> {
    try {
      const params = new URLSearchParams();
      params.append('hashes', 'all');
      
      const response = await this.client.post('/api/v2/torrents/start', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      return response.status === 200;
    } catch (error) {
      console.error('Failed to resume all torrents:', error);
      return false;
    }
  }

  async setPriority(hash: string, priority: 'increase' | 'decrease' | 'maxPrio' | 'minPrio'): Promise<boolean> {
    try {
      const params = new URLSearchParams();
      params.append('hashes', hash);
      
      // Map priority values to correct API endpoints
      const endpointMap = {
        'increase': '/api/v2/torrents/increasePrio',
        'decrease': '/api/v2/torrents/decreasePrio', 
        'maxPrio': '/api/v2/torrents/topPrio',
        'minPrio': '/api/v2/torrents/bottomPrio'
      };
      
      const endpoint = endpointMap[priority];
      const response = await this.client.post(endpoint, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      return response.status === 200;
    } catch (error) {
      console.error(`Failed to set torrent priority (${priority}):`, error);
      return false;
    }
  }

  async getGlobalSpeedLimits(): Promise<{ dlLimit: number; upLimit: number }> {
    try {
      const response = await this.client.get('/api/v2/transfer/info');
      return {
        dlLimit: response.data.dl_rate_limit || 0, // in bytes/sec, 0 = unlimited
        upLimit: response.data.up_rate_limit || 0
      };
    } catch (error) {
      console.error('Failed to get speed limits:', error);
      return { dlLimit: 0, upLimit: 0 };
    }
  }

  async setGlobalDownloadLimit(limitMBps: number): Promise<boolean> {
    try {
      const limitBytes = limitMBps <= 0 ? 0 : limitMBps * 1024 * 1024; // Convert MB/s to bytes/s
      const params = new URLSearchParams();
      params.append('limit', limitBytes.toString());
      
      const response = await this.client.post('/api/v2/transfer/setDownloadLimit', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      return response.status === 200;
    } catch (error) {
      console.error('Failed to set download limit:', error);
      return false;
    }
  }

  async setGlobalUploadLimit(limitMBps: number): Promise<boolean> {
    try {
      const limitBytes = limitMBps <= 0 ? 0 : limitMBps * 1024 * 1024; // Convert MB/s to bytes/s
      const params = new URLSearchParams();
      params.append('limit', limitBytes.toString());
      
      const response = await this.client.post('/api/v2/transfer/setUploadLimit', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      return response.status === 200;
    } catch (error) {
      console.error('Failed to set upload limit:', error);
      return false;
    }
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  formatSpeed(bytesPerSec: number): string {
    if (bytesPerSec === 0) return '0 B/s';
    return this.formatSize(bytesPerSec) + '/s';
  }
}