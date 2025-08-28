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

      let responseMessage = `🔍 **Search Results for:** "${query}"\n\n`;

      results.slice(0, 8).forEach((result, index) => {
        const title = result.title.length > 50 ? result.title.substring(0, 47) + '...' : result.title;
        responseMessage += `${index + 1}. ${title}\n`;
        responseMessage += `📁 ${result.size} | 🌱 ${result.seeders} | 👥 ${result.leechers}\n`;
        responseMessage += `📂 ${result.category} | 📅 ${result.publishDate}\n`;
        responseMessage += `🔗 ${result.downloadUrl}\n\n`;
      });

      responseMessage += `📊 Found ${results.length} results`;

      // Split message if it's too long for Telegram
      if (responseMessage.length > 4000) {
        const messages = this.splitMessage(responseMessage);
        for (const msg of messages) {
          await ctx.reply(msg, { parse_mode: 'Markdown' });
          await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between messages
        }
      } else {
        await ctx.reply(responseMessage, { parse_mode: 'Markdown' });
      }
    } catch (error) {
      console.error('Search command error:', error);
      await ctx.reply('❌ Failed to search torrents. Make sure Prowlarr is configured properly.');
    }
  }

  private splitMessage(inputMessage: string): string[] {
    const messages: string[] = [];
    const lines = inputMessage.split('\n\n');
    let currentMessage = '';

    for (const line of lines) {
      if ((currentMessage + line + '\n\n').length > 4000) {
        if (currentMessage) {
          messages.push(currentMessage.trim());
          currentMessage = '';
        }
        
        // If single line is too long, truncate it
        if (line.length > 4000) {
          messages.push(line.substring(0, 3990) + '...');
        } else {
          currentMessage = line + '\n\n';
        }
      } else {
        currentMessage += line + '\n\n';
      }
    }

    if (currentMessage.trim()) {
      messages.push(currentMessage.trim());
    }

    return messages;
  }
}