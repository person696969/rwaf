const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');

class SlowmodeCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'slowmode';
        this.aliases = ['slow'];
        this.description = 'Set channel slowmode';
        this.usage = 'n!slowmode <0-21600> [reason]';
        this.adminOnly = true;
        this.requiredPermission = PermissionFlagsBits.ManageChannels;
    }

    async execute(message, args) {
        const seconds = parseInt(args[0]);
        
        if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
            return message.reply({ 
                embeds: [EmbedHelper.error('❌ Invalid Duration', 'Slowmode must be between 0 and 21600 seconds (6 hours).\n\n**Examples:**\n• `n!slowmode 5` - 5 seconds\n• `n!slowmode 30` - 30 seconds\n• `n!slowmode 0` - Disable slowmode')] 
            }).catch(() => {});
        }
        
        const reason = args.slice(1).join(' ') || 'No reason provided';

        
        try {
            await message.channel.setRateLimitPerUser(seconds, reason);
            
            let description;
            if (seconds === 0) {
                description = `Slowmode has been **disabled** in ${message.channel}.`;
            } else {
                description = `Slowmode set to **${seconds} second(s)** in ${message.channel}.\n**Reason:** ${reason}`;
            }
            
            const embed = EmbedHelper.success('⏱️ Slowmode Updated', description);
            await message.reply({ embeds: [embed] });
            
            // Log to log channel
            const config = await this.getConfig(message.guild.id);
            if (config.logChannel && config.logChannel !== message.channel.id) {
                const logChannel = message.guild.channels.cache.get(config.logChannel);
                if (logChannel && logChannel.isTextBased()) {
                    const logEmbed = EmbedHelper.info(
                        '⏱️ Slowmode Changed',
                        `**Moderator:** ${message.author}\n**Channel:** ${message.channel}\n**Duration:** ${seconds}s\n**Reason:** ${reason}`
                    );
                    await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            }
        } catch (error) {
            console.error('Error setting slowmode:', error);
            await message.reply({ 
                embeds: [EmbedHelper.error('❌ Error', 'Failed to set slowmode. Make sure I have the "Manage Channels" permission.')] 
            }).catch(() => {});
        }
    }
}

module.exports = SlowmodeCommand;