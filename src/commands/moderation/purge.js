const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');

class BulkDeleteCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'bulkdelete';
        this.aliases = ['purge', 'clear'];
        this.description = 'Bulk delete messages';
        this.usage = 'n!bulkdelete <1-100> [@user]';
        this.adminOnly = true;
        this.requiredPermission = PermissionFlagsBits.ManageMessages;
    }

    async execute(message, args) {
        const amount = parseInt(args[0]);
        
        if (isNaN(amount) || amount < 1 || amount > 100) {
            return message.reply({ 
                embeds: [EmbedHelper.error('❌ Invalid Amount', 'Please provide a number between 1 and 100.')] 
            }).catch(() => {});
        }
        
        const targetUser = message.mentions.users.first();
        
        try {
            await message.delete().catch(() => {});
            
            const fetchedMessages = await message.channel.messages.fetch({ limit: Math.min(amount + 1, 100) });
            
            let messagesToDelete = Array.from(fetchedMessages.values());
            
            // Filter by user if specified
            if (targetUser) {
                messagesToDelete = messagesToDelete.filter(msg => msg.author.id === targetUser.id);
            }
            
            // Filter messages older than 14 days
            const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
            messagesToDelete = messagesToDelete.filter(msg => msg.createdTimestamp > twoWeeksAgo);
            
            if (messagesToDelete.length === 0) {
                return message.channel.send({ 
                    embeds: [EmbedHelper.warning('⚠️ No Messages', 'No messages found to delete (messages must be less than 14 days old).')] 
                }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
            }
            
            const deleted = await message.channel.bulkDelete(messagesToDelete, true);
            
            const embed = EmbedHelper.success(
                '✅ Messages Deleted',
                `Successfully deleted **${deleted.size}** message(s)${targetUser ? ` from ${targetUser.tag}` : ''}.`
            );
            
            const response = await message.channel.send({ embeds: [embed] });
            setTimeout(() => response.delete().catch(() => {}), 5000);
            
            // Log to log channel
            const config = await this.getConfig(message.guild.id);
            if (config.logChannel) {
                const logChannel = message.guild.channels.cache.get(config.logChannel);
                if (logChannel && logChannel.isTextBased()) {
                    const logEmbed = EmbedHelper.info(
                        '🗑️ Bulk Delete',
                        `**Moderator:** ${message.author}\n**Channel:** ${message.channel}\n**Messages Deleted:** ${deleted.size}${targetUser ? `\n**Target User:** ${targetUser.tag}` : ''}`
                    );
                    await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            }
        } catch (error) {
            console.error('Error bulk deleting messages:', error);
            return message.channel.send({ 
                embeds: [EmbedHelper.error('❌ Error', 'Failed to delete messages. Make sure I have the "Manage Messages" permission.')] 
            }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
        }
    }
}

module.exports = BulkDeleteCommand;