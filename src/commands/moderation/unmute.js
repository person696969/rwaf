class UnmuteCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'unmute';
        this.description = 'Unmute a user';
        this.usage = 'n!unmute @user';
        this.adminOnly = true;
        this.requiredPermission = PermissionFlagsBits.ModerateMembers;
    }

    async execute(message, args) {
        const targetUser = message.mentions.users.first();
        
        if (!targetUser) {
            return message.reply({ 
                embeds: [EmbedHelper.error('❌ No User', 'Usage: n!unmute @user')] 
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
                embeds: [EmbedHelper.error('❌ Cannot Unmute', 'Insufficient permissions.')] 
            }).catch(() => {});
        }
        
        try {
            await targetMember.timeout(null);
            
            const embed = EmbedHelper.success(
                '🔊 User Unmuted',
                `${targetUser.tag} has been unmuted.`
            );
            await message.reply({ embeds: [embed] });
            
            // Log to log channel
            const config = await this.getConfig(message.guild.id);
            if (config.logChannel) {
                const logChannel = message.guild.channels.cache.get(config.logChannel);
                if (logChannel && logChannel.isTextBased()) {
                    const logEmbed = EmbedHelper.success(
                        '🔊 User Unmuted',
                        `**Moderator:** ${message.author}\n**User:** ${targetUser} (${targetUser.tag})`
                    );
                    await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            }
        } catch (error) {
            console.error('Error unmuting user:', error);
            await message.reply({ 
                embeds: [EmbedHelper.error('❌ Error', 'Failed to unmute user.')] 
            }).catch(() => {});
        }
    }
}

module.exports = UnmuteCommand;
