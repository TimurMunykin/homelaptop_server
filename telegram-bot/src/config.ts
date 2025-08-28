import { Config } from './types';
import * as dotenv from 'dotenv';

dotenv.config();

export const config: Config = {
  botToken: process.env.BOT_TOKEN || '',
  allowedChatIds: process.env.ALLOWED_CHAT_IDS 
    ? process.env.ALLOWED_CHAT_IDS.split(',').map(id => parseInt(id.trim()))
    : [],
  services: {
    qbittorrent: {
      url: process.env.QBITTORRENT_URL || 'http://localhost:8081',
      username: process.env.QBITTORRENT_USERNAME,
      password: process.env.QBITTORRENT_PASSWORD,
    },
    jackett: {
      url: process.env.PROWLARR_URL || 'http://localhost:9696',
      apiKey: process.env.JACKETT_API_KEY,
    },
    matrix: {
      url: process.env.MATRIX_URL || 'http://localhost:8090',
      accessToken: process.env.MATRIX_ACCESS_TOKEN,
    },
  },
  serverName: process.env.SERVER_NAME || 'HomeServer',
};

export function validateConfig(): void {
  if (!config.botToken) {
    throw new Error('BOT_TOKEN is required');
  }
  
  if (config.allowedChatIds.length === 0) {
    console.warn('Warning: No ALLOWED_CHAT_IDS specified. Bot will respond to all users.');
  }
}