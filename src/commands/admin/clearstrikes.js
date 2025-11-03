const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');

class ClearStrikesCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'clearstrikes';
        this.description = 'Clear user strikes';
        this.usage = 'n!clearstrikes @user';
        this.aliases = ['resetstrikes', 'pardon'];
        this.adminOnly = true;
        this.requiredPermission = PermissionFlagsBits.Administrator;
    }

    async execute(message, args) {
        const user = message.mentions.users.first() || 
                     await this.bot.client.users.fetch(args[0]).catch(() => null);

        if (!user) {
            const embed = EmbedHelper.error(
                '❌ User Not Found',
                'Please mention a user or provide a valid user ID.'
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        const strikes = await this.bot.dbManager.get('strikes', `${message.guild.id}_${user.id}`);

        if (!strikes || strikes.count === 0) {
            const embed = EmbedHelper.info(
                'ℹ️ No Strikes',
                `${user.tag} has no strikes to clear.`
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        await this.bot.dbManager.delete('strikes', `${message.guild.id}_${user.id}`);

        const embed = EmbedHelper.success(
            '✅ Strikes Cleared',
            `All ${strikes.count} strike(s) have been cleared for ${user.tag}.`
        );

        await message.reply({ embeds: [embed] }).catch(() => {});

        // Log if log channel is configured
        const config = await this.getConfig(message.guild.id);
        if (config.logChannel) {
            const logChannel = message.guild.channels.cache.get(config.logChannel);
            if (logChannel) {
                const logEmbed = EmbedHelper.info(
                    '🔄 Strikes Cleared',
                    `**Moderator:** ${message.author.tag}\n**User:** ${user.tag}\n**Strikes Cleared:** ${strikes.count}`
                );
                await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
            }
        }
    }
}

module.exports = ClearStrikesCommand;
