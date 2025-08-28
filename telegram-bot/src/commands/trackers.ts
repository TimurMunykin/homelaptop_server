import { Context } from 'telegraf';
import { ProwlarrService } from '../services/prowlarr';

export class TrackersCommand {
  private prowlarr: ProwlarrService;

  constructor() {
    this.prowlarr = new ProwlarrService();
  }

  async execute(ctx: Context): Promise<void> {
    try {
      await ctx.reply('🔍 Getting your configured trackers...');

      const indexers = await this.prowlarr.getIndexers();

      if (indexers.length === 0) {
        await ctx.reply('📭 No configured trackers found.\n\nTo add trackers:\n1. Open http://localhost:9696\n2. Go to Settings → Indexers\n3. Click "+" to add new indexers');
        return;
      }

      let message = `🔍 **Your Configured Trackers (${indexers.length})**\n\n`;

      indexers.forEach((indexer, index) => {
        const name = indexer.name.length > 30 ? indexer.name.substring(0, 27) + '...' : indexer.name;
        const status = indexer.enable ? '🟢' : '🔴';
        message += `${index + 1}. ${status} **${name}**\n`;
        message += `   ID: \`${indexer.id}\` | Priority: ${indexer.priority}\n\n`;
      });
      
      message += `💡 **Usage:**\n`;
      message += `/search <query> - Search all trackers\n`;
      message += `Example: \`/search Ubuntu 22.04\``;

      // Split message if too long
      if (message.length > 4000) {
        const parts = this.splitMessage(message);
        for (const part of parts) {
          await ctx.reply(part, { parse_mode: 'Markdown' });
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } else {
        await ctx.reply(message, { parse_mode: 'Markdown' });
      }
    } catch (error) {
      console.error('Trackers command error:', error);
      await ctx.reply('❌ Failed to get trackers list. Try again or check Prowlarr configuration.');
    }
  }

  private splitMessage(message: string): string[] {
    const parts: string[] = [];
    const lines = message.split('\n');
    let currentPart = '';

    for (const line of lines) {
      if ((currentPart + line + '\n').length > 4000) {
        if (currentPart) {
          parts.push(currentPart.trim());
          currentPart = '';
        }
      }
      currentPart += line + '\n';
    }

    if (currentPart.trim()) {
      parts.push(currentPart.trim());
    }

    return parts;
  }
}