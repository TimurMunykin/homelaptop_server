import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { ServiceStatus } from '../types';

export interface MatrixServerInfo {
  server_name: string;
  version: string;
}

export class TorrServerService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.services.matrix.url, // reusing matrix config for torrserver
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async checkStatus(): Promise<ServiceStatus> {
    try {
      const startTime = Date.now();
      
      // Check TorrServer web interface
      const response = await this.client.get('/');
      const responseTime = Date.now() - startTime;
      
      // Check if response contains TorrServer signature
      const isTorrServer = response.data && response.data.includes('TorrServer MatriX');
      
      return {
        name: 'TorrServer',
        status: 'online',
        message: isTorrServer ? 'Web interface accessible' : 'HTTP server accessible',
        responseTime,
      };
    } catch (error) {
      // Try API endpoint
      try {
        const startTime = Date.now();
        const response = await this.client.get('/echo');
        const responseTime = Date.now() - startTime;
        
        return {
          name: 'TorrServer',
          status: 'online',
          message: 'API accessible',
          responseTime,
        };
      } catch (apiError) {
        return {
          name: 'TorrServer',
          status: 'offline',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  }

  async getServerStats(): Promise<any> {
    try {
      if (!config.services.matrix.accessToken) {
        throw new Error('Matrix access token is not configured');
      }

      // This would require admin API access
      const response = await this.client.get('/_synapse/admin/v1/server_version', {
        headers: {
          'Authorization': `Bearer ${config.services.matrix.accessToken}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get Matrix server stats:', error);
      throw error;
    }
  }

  async getRoomCount(): Promise<number> {
    try {
      if (!config.services.matrix.accessToken) {
        return 0;
      }

      const response = await this.client.get('/_synapse/admin/v1/rooms', {
        headers: {
          'Authorization': `Bearer ${config.services.matrix.accessToken}`,
        },
        params: {
          limit: 1, // We just want the total count
        },
      });

      return response.data.total_rooms || 0;
    } catch (error) {
      console.error('Failed to get Matrix room count:', error);
      return 0;
    }
  }

  async getUserCount(): Promise<number> {
    try {
      if (!config.services.matrix.accessToken) {
        return 0;
      }

      const response = await this.client.get('/_synapse/admin/v2/users', {
        headers: {
          'Authorization': `Bearer ${config.services.matrix.accessToken}`,
        },
        params: {
          limit: 1, // We just want the total count
        },
      });

      return response.data.total || 0;
    } catch (error) {
      console.error('Failed to get Matrix user count:', error);
      return 0;
    }
  }
}