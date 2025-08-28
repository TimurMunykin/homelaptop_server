import { Context } from 'telegraf';
import { QBittorrentService } from '../services/qbittorrent';
import { ProwlarrService } from '../services/prowlarr';
import { config } from '../config';

export class StatusCommand {
  private qbittorrent: QBittorrentService;
  private prowlarr: ProwlarrService;

  constructor() {
    this.qbittorrent = new QBittorrentService();
    this.prowlarr = new ProwlarrService();
  }

  async execute(ctx: Context): Promise<void> {
    try {
      await ctx.reply('🔍 Checking services status...');

      const [qbStatus, prowlarrStatus] = await Promise.allSettled([
        this.qbittorrent.checkStatus(),
        this.prowlarr.checkStatus(),
      ]);

      let message = `🏠 ${config.serverName} Status Report\n\n`;

      // qBittorrent status
      if (qbStatus.status === 'fulfilled') {
        const status = qbStatus.value;
        const emoji = status.status === 'online' ? '🟢' : '🔴';
        message += `${emoji} **${status.name}**\n`;
        message += `   Status: ${status.status}\n`;
        if (status.message) message += `   ${status.message}\n`;
        if (status.responseTime) message += `   Response: ${status.responseTime}ms\n`;
      } else {
        message += `🔴 **qBittorrent**\n   Status: error\n   ${qbStatus.reason}\n`;
      }

      message += '\n';

      // Prowlarr status
      if (prowlarrStatus.status === 'fulfilled') {
        const status = prowlarrStatus.value;
        const emoji = status.status === 'online' ? '🟢' : '🔴';
        message += `${emoji} **${status.name}**\n`;
        message += `   Status: ${status.status}\n`;
        if (status.message) message += `   ${status.message}\n`;
        if (status.responseTime) message += `   Response: ${status.responseTime}ms\n`;
      } else {
        message += `🔴 **Prowlarr**\n   Status: error\n   ${prowlarrStatus.reason}\n`;
      }

      message += `\n📅 Last checked: ${new Date().toLocaleString()}`;

      await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Status command error:', error);
      await ctx.reply('❌ Failed to check services status.');
    }
  }
}