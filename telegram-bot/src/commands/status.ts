import { Context } from 'telegraf';
import { QBittorrentService } from '../services/qbittorrent';
import { JackettService } from '../services/jackett';
import { TorrServerService } from '../services/matrix';
import { config } from '../config';

export class StatusCommand {
  private qbittorrent: QBittorrentService;
  private jackett: JackettService;
  private torrserver: TorrServerService;

  constructor() {
    this.qbittorrent = new QBittorrentService();
    this.jackett = new JackettService();
    this.torrserver = new TorrServerService();
  }

  async execute(ctx: Context): Promise<void> {
    try {
      await ctx.reply('🔍 Checking services status...');

      const [qbStatus, jackettStatus, torrserverStatus] = await Promise.allSettled([
        this.qbittorrent.checkStatus(),
        this.jackett.checkStatus(),
        this.torrserver.checkStatus(),
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

      // Jackett status
      if (jackettStatus.status === 'fulfilled') {
        const status = jackettStatus.value;
        const emoji = status.status === 'online' ? '🟢' : '🔴';
        message += `${emoji} **${status.name}**\n`;
        message += `   Status: ${status.status}\n`;
        if (status.message) message += `   ${status.message}\n`;
        if (status.responseTime) message += `   Response: ${status.responseTime}ms\n`;
      } else {
        message += `🔴 **Jackett**\n   Status: error\n   ${jackettStatus.reason}\n`;
      }

      message += '\n';

      // TorrServer status
      if (torrserverStatus.status === 'fulfilled') {
        const status = torrserverStatus.value;
        const emoji = status.status === 'online' ? '🟢' : '🔴';
        message += `${emoji} **${status.name}**\n`;
        message += `   Status: ${status.status}\n`;
        if (status.message) message += `   ${status.message}\n`;
        if (status.responseTime) message += `   Response: ${status.responseTime}ms\n`;
      } else {
        message += `🔴 **TorrServer**\n   Status: error\n   ${torrserverStatus.reason}\n`;
      }

      message += `\n📅 Last checked: ${new Date().toLocaleString()}`;

      await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Status command error:', error);
      await ctx.reply('❌ Failed to check services status.');
    }
  }
}