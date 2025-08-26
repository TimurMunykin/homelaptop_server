import { Context } from 'telegraf';
import { SystemUtils } from '../utils/system';
import { TorrServerService } from '../services/matrix';
import { config } from '../config';

export class SystemCommand {
  private torrserver: TorrServerService;

  constructor() {
    this.torrserver = new TorrServerService();
  }

  async execute(ctx: Context): Promise<void> {
    try {
      await ctx.reply('📊 Gathering system information...');

      const [systemInfo] = await Promise.allSettled([
        SystemUtils.getSystemInfo(),
      ]);

      let message = `💻 ${config.serverName} System Information\n\n`;

      // System info
      if (systemInfo.status === 'fulfilled') {
        const info = systemInfo.value;
        
        message += `⏱️ **Uptime:** ${SystemUtils.formatUptime(info.uptime)}\n\n`;
        
        message += `🧠 **Memory Usage:**\n`;
        message += `   Total: ${SystemUtils.formatBytes(info.memory.total)}\n`;
        message += `   Used: ${SystemUtils.formatBytes(info.memory.used)} (${Math.round((info.memory.used / info.memory.total) * 100)}%)\n`;
        message += `   Free: ${SystemUtils.formatBytes(info.memory.free)}\n\n`;
        
        message += `⚡ **CPU Usage:** ${info.cpu.usage.toFixed(1)}%\n\n`;
        
        message += `💾 **Disk Usage (/):**\n`;
        message += `   Total: ${SystemUtils.formatBytes(info.disk.total)}\n`;
        message += `   Used: ${SystemUtils.formatBytes(info.disk.used)} (${Math.round((info.disk.used / info.disk.total) * 100)}%)\n`;
        message += `   Free: ${SystemUtils.formatBytes(info.disk.free)}\n\n`;
      } else {
        message += `❌ Failed to get system information\n\n`;
      }


      message += `📅 Last checked: ${new Date().toLocaleString()}`;

      await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('System command error:', error);
      await ctx.reply('❌ Failed to get system information.');
    }
  }

}