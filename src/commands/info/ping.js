const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');

class PingCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'ping';
        this.description = 'Check bot latency';
        this.usage = 'n!ping';
    }

    async execute(message, args) {
        const sent = await message.reply({ 
            embeds: [EmbedHelper.info('🏓 Pinging...', 'Measuring latency...')] 
        });
        
        const latency = sent.createdTimestamp - message.createdTimestamp;
        const apiLatency = this.bot.client.ws.ping;
        
        const status = apiLatency < 100 ? '✅ Excellent' : apiLatency < 200 ? '🟡 Good' : '🔴 Poor';
        
        const embed = EmbedHelper.info(
            '🏓 Pong!',
            `**Bot Latency:** ${latency}ms\n**API Latency:** ${apiLatency}ms\n**Status:** ${status}`
        );
        
        await sent.edit({ embeds: [embed] });
    }
}

module.exports = PingCommand;