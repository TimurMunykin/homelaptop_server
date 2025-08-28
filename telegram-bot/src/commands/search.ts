import { Context } from 'telegraf';
import { ProwlarrService } from '../services/prowlarr';

export class SearchCommand {
  private prowlarr: ProwlarrService;

  constructor() {
    this.prowlarr = new ProwlarrService();
  }

  async execute(ctx: Context): Promise<void> {
    try {
      // Extract search query from message
      const messageText = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
      const query = messageText.replace('/search', '').trim();

      if (!query) {
        await ctx.reply(
          '🔍 **Search Usage:**\n' +
          '`/search <query>`\n\n' +
          '**Examples:**\n' +
          '`/search Ubuntu 22.04`\n' +
          '`/search The Matrix 1999`\n' +
          '`/search Breaking Bad S01`',
          { parse_mode: 'Markdown' }
        );
        return;
      }

      await ctx.reply(`🔍 Searching for: "${query}"...`);

      const results = await this.prowlarr.search(query);

      if (results.length === 0) {
        await ctx.reply('📭 No results found for your search query.');
        return;
      }

      // Store search results in memory for callback handling
      if (!(global as any).searchResults) {
        (global as any).searchResults = new Map();
      }

      const limitedResults = results.slice(0, 8);
      
      for (let i = 0; i < limitedResults.length; i++) {
        const result = limitedResults[i];
        let title = result.title.length > 60 ? result.title.substring(0, 57) + '...' : result.title;
        
        // Escape all markdown special characters for Telegram
        title = title
          .replace(/\\/g, '\\\\')  // Backslash first
          .replace(/\*/g, '\\*')
          .replace(/_/g, '\\_')
          .replace(/\[/g, '\\[')
          .replace(/\]/g, '\\]')
          .replace(/\(/g, '\\(')
          .replace(/\)/g, '\\)')
          .replace(/~/g, '\\~')
          .replace(/`/g, '\\`')
          .replace(/>/g, '\\>')
          .replace(/#/g, '\\#')
          .replace(/\+/g, '\\+')
          .replace(/-/g, '\\-')
          .replace(/=/g, '\\=')
          .replace(/\|/g, '\\|')
          .replace(/\{/g, '\\{')
          .replace(/\}/g, '\\}')
          .replace(/\./g, '\\.')
          .replace(/!/g, '\\!');
        
        let message = `🔍 **${title}**\n\n`;
        message += `📁 Size: ${result.size}\n`;
        message += `🌱 Seeders: ${result.seeders} | 👥 Leechers: ${result.leechers}\n`;
        message += `📂 Category: ${result.category}\n`;
        message += `🔍 Indexer: ${result.indexer}\n`;
        message += `📅 Date: ${result.publishDate}`;

        // Generate unique key for this search result
        const resultKey = `${ctx.from?.id}_${Date.now()}_${i}`;
        (global as any).searchResults.set(resultKey, {
          title: result.title,
          downloadUrl: result.downloadUrl,
          infoUrl: result.infoUrl,
          guid: result.guid
        });

        // Create inline keyboard with action buttons
        const keyboard = {
          inline_keyboard: [[
            { 
              text: '📥 Add to qBittorrent', 
              callback_data: `add_torrent:${resultKey}` 
            }
          ], [
            { 
              text: '🔗 Copy Magnet', 
              callback_data: `copy_magnet:${resultKey}` 
            },
            { 
              text: '🌐 Copy Info URL', 
              callback_data: `copy_info:${resultKey}` 
            }
          ]]
        };

        await ctx.reply(message, { 
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
        
        // Small delay between messages to avoid rate limiting
        if (i < limitedResults.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      if (limitedResults.length > 0) {
        await ctx.reply(`📊 Showing ${limitedResults.length} of ${results.length} results`);
      }
    } catch (error) {
      console.error('Search command error:', error);
      await ctx.reply('❌ Failed to search torrents. Make sure Prowlarr is configured properly.');
    }
  }
}