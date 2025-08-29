import { Context } from 'telegraf';
import { QBittorrentService } from '../services/qbittorrent';

export class SpeedCommand {
  private qbittorrent: QBittorrentService;

  constructor() {
    this.qbittorrent = new QBittorrentService();
  }

  async execute(ctx: Context): Promise<void> {
    try {
      const limits = await this.qbittorrent.getGlobalSpeedLimits();
      
      const dlLimitMBps = limits.dlLimit > 0 ? Math.round(limits.dlLimit / (1024 * 1024)) : 0;
      const upLimitMBps = limits.upLimit > 0 ? Math.round(limits.upLimit / (1024 * 1024)) : 0;

      const message = `🚀 Speed Limits Control

⬇️ Download: ${dlLimitMBps === 0 ? '∞ Unlimited' : `${dlLimitMBps} MB/s`}
⬆️ Upload: ${upLimitMBps === 0 ? '∞ Unlimited' : `${upLimitMBps} MB/s`}

Use ± buttons to adjust by 1 MB/s:`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '−', callback_data: 'speed_dl_minus' },
            { text: `⬇️ ${dlLimitMBps === 0 ? '∞' : dlLimitMBps} MB/s`, callback_data: 'noop' },
            { text: '+', callback_data: 'speed_dl_plus' }
          ],
          [
            { text: '−', callback_data: 'speed_up_minus' },
            { text: `⬆️ ${upLimitMBps === 0 ? '∞' : upLimitMBps} MB/s`, callback_data: 'noop' },
            { text: '+', callback_data: 'speed_up_plus' }
          ],
          [
            { text: '🔄 Refresh', callback_data: 'speed_refresh' },
            { text: '♾️ Unlimited', callback_data: 'speed_unlimited' }
          ]
        ]
      };

      await ctx.reply(message, { reply_markup: keyboard });

    } catch (error) {
      console.error('Speed command error:', error);
      await ctx.reply('❌ Failed to get speed limits information.');
    }
  }

  async updateSpeedKeyboard(ctx: any): Promise<void> {
    try {
      const limits = await this.qbittorrent.getGlobalSpeedLimits();
      
      const dlLimitMBps = limits.dlLimit > 0 ? Math.round(limits.dlLimit / (1024 * 1024)) : 0;
      const upLimitMBps = limits.upLimit > 0 ? Math.round(limits.upLimit / (1024 * 1024)) : 0;

      const message = `🚀 Speed Limits Control

⬇️ Download: ${dlLimitMBps === 0 ? '∞ Unlimited' : `${dlLimitMBps} MB/s`}
⬆️ Upload: ${upLimitMBps === 0 ? '∞ Unlimited' : `${upLimitMBps} MB/s`}

Use ± buttons to adjust by 1 MB/s:`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '−', callback_data: 'speed_dl_minus' },
            { text: `⬇️ ${dlLimitMBps === 0 ? '∞' : dlLimitMBps} MB/s`, callback_data: 'noop' },
            { text: '+', callback_data: 'speed_dl_plus' }
          ],
          [
            { text: '−', callback_data: 'speed_up_minus' },
            { text: `⬆️ ${upLimitMBps === 0 ? '∞' : upLimitMBps} MB/s`, callback_data: 'noop' },
            { text: '+', callback_data: 'speed_up_plus' }
          ],
          [
            { text: '🔄 Refresh', callback_data: 'speed_refresh' },
            { text: '♾️ Unlimited', callback_data: 'speed_unlimited' }
          ]
        ]
      };

      await ctx.editMessageText(message, { reply_markup: keyboard });

    } catch (error) {
      console.error('Speed keyboard update error:', error);
      // Игнорируем ошибку "message not modified" - это нормально
      if (error instanceof Error && !error.message?.includes('message is not modified')) {
        await ctx.answerCbQuery('❌ Failed to update');
      }
    }
  }
}