const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');

class MuteCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'mute';
        this.description = 'Mute a user (permanent timeout)';
        this.usage = 'n!mute @user [reason]';
        this.adminOnly = true;
        this.requiredPermission = PermissionFlagsBits.ModerateMembers;
    }

    async execute(message, args) {
        const targetUser = message.mentions.users.first();
        
        if (!targetUser) {
            return message.reply({ 
                embeds: [EmbedHelper.error('❌ No User', 'Usage: n!mute @user [reason]')] 
            }).catch(() => {});
        }
        
        const targetMember = message.guild.members.cache.get(targetUser.id);
        
        if (!targetMember) {
            return message.reply({ 
                embeds: [EmbedHelper.error('❌ Not Found', 'User not in this server.')] 
            }).catch(() => {});
        }
        
        if (!targetMember.moderatable) {
            return message.reply({ 
                embeds: [EmbedHelper.error('❌ Cannot Mute', 'Insufficient permissions to mute this user.')] 
            }).catch(() => {});
        }
        
        const reason = args.slice(1).join(' ') || 'No reason provided';
        
        try {
            await targetMember.timeout(28 * 24 * 60 * 60 * 1000, reason);
            await this.incrementStat('timeoutsIssued');
            
            const embed = EmbedHelper.warning(
                '🔇 User Muted',
                `${targetUser.tag} has been muted indefinitely.\n**Reason:** ${reason}\n\n*Use n!unmute to unmute*`
            );
            await message.reply({ embeds: [embed] });
            
            const config = await this.getConfig(message.guild.id);
            if (config.logChannel) {
                const logChannel = message.guild.channels.cache.get(config.logChannel);
                if (logChannel && logChannel.isTextBased()) {
                    const logEmbed = EmbedHelper.warning(
                        '🔇 User Muted',
                        `**Moderator:** ${message.author}\n**User:** ${targetUser} (${targetUser.tag})\n**Reason:** ${reason}`
                    );
                    await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            }
        } catch (error) {
            console.error('Error muting user:', error);
            await message.reply({ 
                embeds: [EmbedHelper.error('❌ Error', 'Failed to mute user.')] 
            }).catch(() => {});
        }
    }
}

module.exports = MuteCommand;
