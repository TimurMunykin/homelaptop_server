import { Context } from 'telegraf';
import { QBittorrentService } from '../services/qbittorrent';

export class TorrentsCommand {
  private qbittorrent: QBittorrentService;

  constructor() {
    this.qbittorrent = new QBittorrentService();
  }

  async execute(ctx: Context): Promise<void> {
    try {
      await ctx.reply('🔍 Fetching torrent information...');

      const torrents = await this.qbittorrent.getTorrents();

      if (torrents.length === 0) {
        await ctx.reply('📭 No active torrents found.');
        return;
      }

      // Store torrent data globally for callback handling
      if (!(global as any).torrentData) {
        (global as any).torrentData = new Map();
      }

      // Show first 5 torrents with controls
      const displayTorrents = torrents.slice(0, 5);
      
      for (let i = 0; i < displayTorrents.length; i++) {
        const torrent = displayTorrents[i];
        const stateEmoji = this.getStateEmoji(torrent.state);
        const progressBar = this.createProgressBar(torrent.progress);
        const name = torrent.name.length > 50 ? torrent.name.substring(0, 47) + '...' : torrent.name;
        
        let message = `${stateEmoji} ${name}\n`;
        message += `${progressBar} ${torrent.progress}%\n`;
        message += `📁 ${this.qbittorrent.formatSize(torrent.size)}`;
        
        if (torrent.dlspeed > 0) {
          message += ` | ⬇️ ${this.qbittorrent.formatSpeed(torrent.dlspeed)}`;
        }
        if (torrent.upspeed > 0) {
          message += ` | ⬆️ ${this.qbittorrent.formatSpeed(torrent.upspeed)}`;
        }

        // Store torrent data for callbacks
        const torrentKey = `torrent_${ctx.from?.id}_${Date.now()}_${i}`;
        (global as any).torrentData.set(torrentKey, {
          hash: torrent.hash,
          name: torrent.name,
          state: torrent.state
        });

        // Create control buttons based on torrent state
        const keyboard = this.createTorrentControlKeyboard(torrent, torrentKey);

        await ctx.reply(message, { reply_markup: keyboard });
      }

      // Summary message
      if (torrents.length > 5) {
        await ctx.reply(`... and ${torrents.length - 5} more torrents (showing first 5)`);
      }

      // Calculate totals
      const totalDlSpeed = torrents.reduce((sum, t) => sum + t.dlspeed, 0);
      const totalUpSpeed = torrents.reduce((sum, t) => sum + t.upspeed, 0);

      if (totalDlSpeed > 0 || totalUpSpeed > 0) {
        let totalMessage = `📊 Total Speed:\n`;
        if (totalDlSpeed > 0) totalMessage += `⬇️ ${this.qbittorrent.formatSpeed(totalDlSpeed)}\n`;
        if (totalUpSpeed > 0) totalMessage += `⬆️ ${this.qbittorrent.formatSpeed(totalUpSpeed)}`;
        await ctx.reply(totalMessage);
      }

      // Add smart bulk control buttons if there are torrents
      if (torrents.length > 0) {
        const bulkKeyboard = this.createSmartBulkKeyboard(torrents);
        await ctx.reply('🎛️ Bulk Operations:', { reply_markup: bulkKeyboard });
      }

    } catch (error) {
      console.error('Torrents command error:', error);
      await ctx.reply('❌ Failed to fetch torrents information.');
    }
  }

  private getStateEmoji(state: string): string {
    const stateMap: { [key: string]: string } = {
      'downloading': '📥',
      'uploading': '📤',
      'completed': '✅',
      'pausedDL': '⏸️',
      'pausedUP': '⏸️',
      'stoppedDL': '⏸️',
      'stoppedUP': '⏸️',
      'queuedDL': '⏳',
      'queuedUP': '⏳',
      'stalledDL': '🔄',
      'stalledUP': '🔄',
      'error': '❌',
    };
    return stateMap[state] || '❓';
  }

  private createProgressBar(progress: number): string {
    const width = 10;
    const filled = Math.round((progress / 100) * width);
    const empty = width - filled;
    
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  private createTorrentControlKeyboard(torrent: any, torrentKey: string) {
    const row1 = [];
    const row2 = [];
    
    // Pause/Resume button based on state
    if (torrent.state === 'downloading' || torrent.state === 'uploading' || torrent.state === 'queuedDL' || torrent.state === 'queuedUP') {
      row1.push({ text: '⏸️ Пауза', callback_data: `torrent_pause:${torrentKey}` });
    } else if (torrent.state === 'pausedDL' || torrent.state === 'pausedUP' || torrent.state === 'stoppedDL' || torrent.state === 'stoppedUP') {
      row1.push({ text: '▶️ Старт', callback_data: `torrent_resume:${torrentKey}` });
    }
    
    // Delete button that opens submenu
    row1.push({ text: '🗑️ Удалить', callback_data: `torrent_delete_menu:${torrentKey}` });

    // Priority buttons
    row2.push({ text: '🔼 Max', callback_data: `torrent_priority_max:${torrentKey}` });
    row2.push({ text: '🔽 Min', callback_data: `torrent_priority_min:${torrentKey}` });

    const keyboard = [row1];
    if (row2.length > 0) keyboard.push(row2);

    return { 
      inline_keyboard: keyboard
    };
  }

  private createDeleteConfirmationKeyboard(torrentKey: string) {
    return {
      inline_keyboard: [
        [
          { text: '🗑️ Только торрент', callback_data: `torrent_delete:${torrentKey}` },
          { text: '🗑️💾 С файлами', callback_data: `torrent_delete_files:${torrentKey}` }
        ],
        [
          { text: '❌ Отмена', callback_data: `torrent_cancel:${torrentKey}` }
        ]
      ]
    };
  }

  private createSmartBulkKeyboard(torrents: any[]) {
    const activeTorrents = torrents.filter(t => 
      t.state === 'downloading' || t.state === 'uploading' || t.state === 'stalledDL' || t.state === 'stalledUP' || t.state === 'queuedDL' || t.state === 'queuedUP'
    );
    const pausedTorrents = torrents.filter(t => 
      t.state === 'pausedDL' || t.state === 'pausedUP' || t.state === 'stoppedDL' || t.state === 'stoppedUP'
    );

    const buttons = [];

    if (activeTorrents.length > 0 && pausedTorrents.length === 0) {
      // Все активные - только кнопка паузы
      buttons.push({ text: '⏸️ Pause All', callback_data: 'bulk_pause_all' });
    } else if (pausedTorrents.length > 0 && activeTorrents.length === 0) {
      // Все на паузе - только кнопка старт
      buttons.push({ text: '▶️ Resume All', callback_data: 'bulk_resume_all' });
    } else if (activeTorrents.length > 0 && pausedTorrents.length > 0) {
      // Смешанное состояние - обе кнопки
      buttons.push({ text: '⏸️ Pause All', callback_data: 'bulk_pause_all' });
      buttons.push({ text: '▶️ Resume All', callback_data: 'bulk_resume_all' });
    }

    return {
      inline_keyboard: buttons.length > 0 ? [buttons] : []
    };
  }
}