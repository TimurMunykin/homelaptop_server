export interface Config {
  botToken: string;
  allowedChatIds: number[];
  services: {
    qbittorrent: {
      url: string;
      username?: string;
      password?: string;
    };
    jackett: {
      url: string;
      apiKey?: string;
    };
    matrix: {
      url: string;
      accessToken?: string;
    };
  };
  serverName: string;
}

export interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'error';
  message?: string;
  responseTime?: number;
}

export interface TorrentInfo {
  hash: string;
  name: string;
  progress: number;
  dlspeed: number;
  upspeed: number;
  priority: number;
  state: string;
  size: number;
  completed: number;
}

export interface SystemInfo {
  uptime: number;
  memory: {
    total: number;
    free: number;
    used: number;
  };
  cpu: {
    usage: number;
  };
  disk: {
    total: number;
    free: number;
    used: number;
  };
}