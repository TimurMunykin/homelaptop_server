import { Telegraf } from 'telegraf';
import { config, validateConfig } from './config';
import { StatusCommand } from './commands/status';
import { TorrentsCommand } from './commands/torrents';
import { SearchCommand } from './commands/search';
import { SystemCommand } from './commands/system';
import { TrackersCommand } from './commands/trackers';

class HomeServerBot {
  private bot: Telegraf;
  private statusCommand: StatusCommand;
  private torrentsCommand: TorrentsCommand;
  private searchCommand: SearchCommand;
  private systemCommand: SystemCommand;
  private trackersCommand: TrackersCommand;

  constructor() {
    validateConfig();
    
    this.bot = new Telegraf(config.botToken);
    this.statusCommand = new StatusCommand();
    this.torrentsCommand = new TorrentsCommand();
    this.searchCommand = new SearchCommand();
    this.systemCommand = new SystemCommand();
    this.trackersCommand = new TrackersCommand();
    
    this.setupMiddleware();
    this.setupCommands();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    this.bot.use(async (ctx, next) => {
      const chatId = ctx.chat?.id;
      const messageText = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
      
      // Allow /chatid command for everyone to get their chat ID
      if (messageText === '/chatid') {
        return next();
      }
      
      if (config.allowedChatIds.length > 0 && chatId && !config.allowedChatIds.includes(chatId)) {
        await ctx.reply('❌ Access denied. You are not authorized to use this bot.');
        return;
      }
      
      console.log(`[${new Date().toISOString()}] Command from ${ctx.from?.username || ctx.from?.id}: ${messageText}`);
      
      return next();
    });
  }

  private setupCommands(): void {
    this.bot.start((ctx) => {
      ctx.reply(
        `🏠 Welcome to ${config.serverName} Management Bot!\n\n` +
        `Available commands:\n` +
        `/status - Show services status\n` +
        `/torrents - Show active torrents\n` +
        `/search <query> - Search torrents via Prowlarr\n` +
        `/trackers - Show available trackers\n` +
        `/system - Show system information\n` +
        `/chatid - Show your Chat ID for configuration`
      );
    });

    this.bot.help((ctx) => {
      ctx.reply(
        `🆘 Available commands:\n\n` +
        `/status - Show all services status\n` +
        `/torrents - Show active torrents in qBittorrent\n` +
        `/search <query> - Search for torrents via Prowlarr\n` +
        `/trackers - Show available trackers list\n` +
        `/system - Show system information (CPU, RAM, disk)\n` +
        `/chatid - Show your Chat ID for configuration\n\n` +
        `💡 Use /start to see the welcome message again.`
      );
    });

    this.bot.command('status', (ctx) => this.statusCommand.execute(ctx));
    this.bot.command('torrents', (ctx) => this.torrentsCommand.execute(ctx));
    this.bot.command('search', (ctx) => this.searchCommand.execute(ctx));
    this.bot.command('trackers', (ctx) => this.trackersCommand.execute(ctx));
    this.bot.command('system', (ctx) => this.systemCommand.execute(ctx));
    this.bot.command('chatid', (ctx) => {
      const chatId = ctx.chat?.id;
      const userId = ctx.from?.id;
      const username = ctx.from?.username || 'N/A';
      ctx.reply(`📋 Chat ID: ${chatId}\nUser ID: ${userId}\nUsername: ${username}`);
    });

    // Handle inline keyboard callbacks
    this.bot.on('callback_query', async (ctx) => {
      try {
        const callbackData = (ctx.callbackQuery as any).data;
        
        // Handle download callbacks (from filmru search)
        if (callbackData?.startsWith('download:')) {
          await ctx.answerCbQuery('🔄 Добавляем торрент в qBittorrent...');
          
          const torrentKey = callbackData.replace('download:', '');
          const torrentLinks = (global as any).torrentLinks;
          
          if (torrentLinks && torrentLinks.has(torrentKey)) {
            const torrentData = torrentLinks.get(torrentKey);
            const success = await this.torrentsCommand['qbittorrent'].addTorrent(torrentData.link);
            
            if (success) {
              await ctx.editMessageReplyMarkup({ 
                inline_keyboard: [[
                  { text: '✅ Добавлено в очередь', callback_data: 'noop' }
                ]]
              });
              await ctx.reply(`✅ Торрент "${torrentData.title.substring(0, 50)}..." добавлен в qBittorrent!`);
              torrentLinks.delete(torrentKey);
            } else {
              await ctx.answerCbQuery('❌ Не удалось добавить торрент');
              await ctx.reply('❌ Ошибка добавления торрента. Проверьте настройки qBittorrent.');
            }
          } else {
            await ctx.answerCbQuery('❌ Торрент не найден');
          }
        }
        
        // Handle torrent control callbacks
        else if (callbackData?.startsWith('torrent_')) {
          const [action, torrentKey] = callbackData.split(':', 2);
          const torrentData = (global as any).torrentData;
          
          if (!torrentData || !torrentData.has(torrentKey)) {
            await ctx.answerCbQuery('❌ Торрент не найден');
            return;
          }
          
          const torrent = torrentData.get(torrentKey);
          const qb = this.torrentsCommand['qbittorrent'];
          
          switch (action) {
            case 'torrent_pause':
              await ctx.answerCbQuery('⏸️ Ставим на паузу...');
              const pauseSuccess = await qb.pauseTorrent(torrent.hash);
              if (pauseSuccess) {
                // Update torrent state and button
                torrent.state = 'pausedDL';
                const newKeyboard = this.torrentsCommand['createTorrentControlKeyboard'](torrent, torrentKey);
                await ctx.editMessageReplyMarkup(newKeyboard);
              } else {
                await ctx.reply('❌ Не удалось поставить на паузу');
              }
              break;
              
            case 'torrent_resume':
              await ctx.answerCbQuery('▶️ Запускаем...');
              const resumeSuccess = await qb.resumeTorrent(torrent.hash);
              if (resumeSuccess) {
                // Update torrent state and button
                torrent.state = 'downloading';
                const newKeyboard = this.torrentsCommand['createTorrentControlKeyboard'](torrent, torrentKey);
                await ctx.editMessageReplyMarkup(newKeyboard);
              } else {
                await ctx.reply('❌ Не удалось запустить');
              }
              break;

            case 'torrent_delete_menu':
              await ctx.answerCbQuery();
              // Show delete confirmation menu
              const deleteKeyboard = this.torrentsCommand['createDeleteConfirmationKeyboard'](torrentKey);
              await ctx.editMessageReplyMarkup(deleteKeyboard);
              break;

            case 'torrent_cancel':
              await ctx.answerCbQuery('❌ Отменено');
              // Restore original keyboard
              const originalKeyboard = this.torrentsCommand['createTorrentControlKeyboard'](torrent, torrentKey);
              await ctx.editMessageReplyMarkup(originalKeyboard);
              break;
              
            case 'torrent_delete':
              await ctx.answerCbQuery('🗑️ Удаляем торрент...');
              const deleteSuccess = await qb.deleteTorrent(torrent.hash, false);
              if (deleteSuccess) {
                await ctx.editMessageReplyMarkup({ 
                  inline_keyboard: [[
                    { text: '✅ Торрент удален', callback_data: 'noop' }
                  ]]
                });
                torrentData.delete(torrentKey);
              } else {
                await ctx.reply('❌ Не удалось удалить торрент');
                const originalKeyboard = this.torrentsCommand['createTorrentControlKeyboard'](torrent, torrentKey);
                await ctx.editMessageReplyMarkup(originalKeyboard);
              }
              break;
              
            case 'torrent_delete_files':
              await ctx.answerCbQuery('🗑️💾 Удаляем торрент с файлами...');
              const deleteFilesSuccess = await qb.deleteTorrent(torrent.hash, true);
              if (deleteFilesSuccess) {
                await ctx.editMessageReplyMarkup({ 
                  inline_keyboard: [[
                    { text: '✅ Торрент и файлы удалены', callback_data: 'noop' }
                  ]]
                });
                torrentData.delete(torrentKey);
              } else {
                await ctx.reply('❌ Не удалось удалить торрент с файлами');
                const originalKeyboard = this.torrentsCommand['createTorrentControlKeyboard'](torrent, torrentKey);
                await ctx.editMessageReplyMarkup(originalKeyboard);
              }
              break;
          }
        }
        
      } catch (error) {
        console.error('Callback query error:', error);
        await ctx.answerCbQuery('❌ Произошла ошибка');
      }
    });
  }

  private setupErrorHandling(): void {
    this.bot.catch((err, ctx) => {
      console.error('Bot error:', err);
      ctx.reply('❌ An error occurred while processing your request.');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });
  }

  public async start(): Promise<void> {
    try {
      console.log(`🤖 Starting ${config.serverName} Telegram Bot...`);
      
      await this.bot.launch();
      console.log('✅ Bot is running!');
      
      process.once('SIGINT', () => this.stop());
      process.once('SIGTERM', () => this.stop());
      
    } catch (error) {
      console.error('Failed to start bot:', error);
      process.exit(1);
    }
  }

  private async stop(): Promise<void> {
    console.log('🛑 Stopping bot...');
    this.bot.stop();
    process.exit(0);
  }
}

const bot = new HomeServerBot();
bot.start();