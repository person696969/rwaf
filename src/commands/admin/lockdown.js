const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');

class LockdownCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'lockdown';
        this.aliases = ['lock'];
        this.description = 'Lock/unlock a channel';
        this.usage = 'n!lockdown [reason] OR n!lockdown unlock';
        this.adminOnly = true;
        this.requiredPermission = PermissionFlagsBits.ManageChannels;
    }

    async execute(message, args) {
        const action = args[0]?.toLowerCase();
        const isUnlock = action === 'unlock';
        const reason = isUnlock ? 'Channel unlocked' : args.join(' ') || 'No reason provided';
        
        try {
            const channel = message.channel;
            const everyoneRole = message.guild.roles.everyone;
            
            if (isUnlock) {
                await channel.permissionOverwrites.edit(everyoneRole, {
                    SendMessages: null
                });
                
                const embed = EmbedHelper.success(
                    '🔓 Channel Unlocked',
                    `${channel} has been unlocked by ${message.author}.`
                );
                await message.reply({ embeds: [embed] });
            } else {
                await channel.permissionOverwrites.edit(everyoneRole, {
                    SendMessages: false
                });
                
                const embed = EmbedHelper.warning(
                    '🔒 Channel Locked',
                    `${channel} has been locked by ${message.author}.\n**Reason:** ${reason}`
                );
                await message.reply({ embeds: [embed] });
            }
            
            // Log to log channel
            const config = await this.getConfig(message.guild.id);
            if (config.logChannel && config.logChannel !== channel.id) {
                const logChannel = message.guild.channels.cache.get(config.logChannel);
                if (logChannel && logChannel.isTextBased()) {
                    const logEmbed = EmbedHelper.create(
                        isUnlock ? '🔓 Channel Unlocked' : '🔒 Channel Locked',
                        `**Moderator:** ${message.author}\n**Channel:** ${channel}\n**Reason:** ${reason}`,
                        isUnlock ? '#00FF00' : '#FFA500'
                    );
                    await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            }
        } catch (error) {
            console.error('Error in lockdown command:', error);
            await message.reply({ 
                embeds: [EmbedHelper.error('❌ Error', 'Failed to lock/unlock channel. Make sure I have the "Manage Channels" permission.')] 
            }).catch(() => {});
        }
    }
}

module.exports = LockdownCommand;
