const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const env = require('../../config/environment');

class LeaveServerCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'leaveserver';
        this.description = 'Leave a server';
        this.usage = 'n!leaveserver <server_id>';
        this.ownerOnly = true;
    }

    async execute(message, args) {
        const serverId = args[0];
        
        if (!serverId) {
            return message.reply({ 
                embeds: [EmbedHelper.error('❌ Invalid Usage', `Usage: \`${env.prefix}leaveserver <server_id>\``)] 
            }).catch(() => {});
        }
        
        const guild = this.bot.client.guilds.cache.get(serverId);
        
        if (!guild) {
            return message.reply({ 
                embeds: [EmbedHelper.error('❌ Server Not Found', 'Bot is not in a server with that ID.')] 
            }).catch(() => {});
        }
        
        const guildName = guild.name;
        
        try {
            await guild.leave();
            await message.reply({ 
                embeds: [EmbedHelper.success('✅ Left Server', `Successfully left server: **${guildName}**`)] 
            }).catch(() => {});
        } catch (error) {
            console.error('Error leaving server:', error);
            await message.reply({ 
                embeds: [EmbedHelper.error('❌ Error', 'Failed to leave the server.')] 
            }).catch(() => {});
        }
    }
}

module.exports = LeaveServerCommand;