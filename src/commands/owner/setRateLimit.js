const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');

class SetRateLimitCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'setratelimit';
        this.description = 'Set rate limit for a server';
        this.usage = 'n!setratelimit <guild_id> <10-200>';
        this.ownerOnly = true;
    }

    async execute(message, args) {
        const guildId = args[0];
        const rateLimit = parseInt(args[1]);
        
        if (!guildId || isNaN(rateLimit) || rateLimit < 10 || rateLimit > 200) {
            return message.reply({ 
                embeds: [EmbedHelper.error('❌ Invalid Usage', '**Usage:** `n!setratelimit <guild_id> <10-200>`')] 
            }).catch(() => {});
        }
        
        const guild = this.bot.client.guilds.cache.get(guildId);
        if (!guild) {
            return message.reply({ 
                embeds: [EmbedHelper.error('❌ Server Not Found', 'Bot is not in a server with that ID.')] 
            }).catch(() => {});
        }
        
        const config = await this.getConfig(guildId);
        config.rateLimit = rateLimit;
        await this.saveConfig(guildId, config);
        
        await message.reply({ 
            embeds: [EmbedHelper.success('✅ Rate Limit Updated', `Rate limit for **${guild.name}** set to **${rateLimit}** API calls/minute`)] 
        }).catch(() => {});
    }
}

module.exports = SetRateLimitCommand;