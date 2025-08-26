import { Context } from 'telegraf';
import { JackettService } from '../services/jackett';

export class FilmRuCommand {
  private jackett: JackettService;

  constructor() {
    this.jackett = new JackettService();
  }

  async execute(ctx: Context): Promise<void> {
    try {
      // Extract search query from message
      const messageText = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
      let query = messageText.replace('/filmru', '').trim();

      if (!query) {
        await ctx.reply(
          '🎬 **Поиск русских фильмов:**\n' +
          '`/filmru <название фильма>`\n\n' +
          '**Примеры:**\n' +
          '`/filmru Брат`\n' +
          '`/filmru Матрица`\n' +
          '`/filmru Зеленая миля`\n' +
          '`/filmru Интерстеллар 2014`',
          { parse_mode: 'Markdown' }
        );
        return;
      }

      await ctx.reply(`🎬 Ищу "${query}" на RuTracker...`);

      try {
        // Search only on RuTracker indexer
        const results = await this.jackett.searchByIndexer('rutracker', query, 8);

        if (results.length === 0) {
          await ctx.reply('📭 Ничего не найдено. Попробуйте другой запрос или проверьте настройки Jackett.');
          return;
        }

        let responseMessage = `🎬 Найдено "${query}":\n\n`;
        
        // Store torrent links in memory for callback handling
        if (!(global as any).torrentLinks) {
          (global as any).torrentLinks = new Map();
        }

        for (let i = 0; i < Math.min(results.length, 3); i++) {
          const result = results[i];
          let title = result.title.length > 50 ? result.title.substring(0, 47) + '...' : result.title;
          title = title.replace(/[*_`\[\]()]/g, ''); // Remove markdown special characters
          const size = this.jackett.formatSize(result.size);

          responseMessage += `${i + 1}. ${title}\n`;
          responseMessage += `📁 ${size} | 🌱 ${result.seeders} | 👥 ${result.peers}\n`;
          responseMessage += `🏷️ ${result.categoryDesc}\n\n`;
          
          // Generate unique key for this torrent
          const torrentKey = `${ctx.from?.id}_${Date.now()}_${i}`;
          (global as any).torrentLinks.set(torrentKey, {
            link: result.link,
            title: result.title,
            size: result.size
          });
          
          // Add inline keyboard with download button
          const keyboard = {
            inline_keyboard: [[
              { 
                text: '📥 Добавить в qBittorrent', 
                callback_data: `download:${torrentKey}` 
              }
            ]]
          };
          
          await ctx.reply(responseMessage, { reply_markup: keyboard });
          responseMessage = ''; // Reset for next result
        }
        
        // Send tips separately
        await ctx.reply(
          `💡 Советы для лучших результатов на RuTracker:\n` +
          `• Добавьте год: "Брат 1997"\n` +
          `• Укажите качество: "BluRay", "WEB-DL"\n` +
          `• Попробуйте английское название: "Matrix"`
        );
      } catch (searchError) {
        console.error('Search error:', searchError);
        await ctx.reply('❌ Произошла ошибка при поиске. Проверьте настройки RuTracker в Jackett.');
      }
    } catch (error) {
      console.error('FilmRu command error:', error);
      await ctx.reply('❌ Произошла ошибка при поиске. Проверьте настройки Jackett.');
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