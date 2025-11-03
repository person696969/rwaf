const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');

class BanCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'ban';
        this.description = 'Ban a user from the server';
        this.usage = 'n!ban @user [reason]';
        this.adminOnly = true;
        this.requiredPermission = PermissionFlagsBits.BanMembers;
    }

    async execute(message, args) {
        const member = message.mentions.members.first() ||
                      await message.guild.members.fetch(args[0]).catch(() => null);

        if (!member) {
            const embed = EmbedHelper.error(
                '❌ User Not Found',
                'Please mention a user or provide a valid user ID.'
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        if (member.id === message.author.id) {
            const embed = EmbedHelper.error(
                '❌ Invalid Target',
                'You cannot ban yourself.'
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        if (member.id === this.bot.client.user.id) {
            const embed = EmbedHelper.error(
                '❌ Invalid Target',
                'I cannot ban myself.'
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        if (!member.bannable) {
            const embed = EmbedHelper.error(
                '❌ Cannot Ban',
                'I don\'t have permission to ban this user. They may have a higher role than me.'
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        if (member.roles.highest.position >= message.member.roles.highest.position) {
            const embed = EmbedHelper.error(
                '❌ Insufficient Permissions',
                'You cannot ban someone with an equal or higher role.'
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            // DM user before banning
            const dmEmbed = EmbedHelper.error(
                '🔨 You Have Been Banned',
                `**Server:** ${message.guild.name}\n**Reason:** ${reason}\n**Moderator:** ${message.author.tag}`
            );
            await member.send({ embeds: [dmEmbed] }).catch(() => {});

            // Ban the member
            await member.ban({ reason, deleteMessageDays: 1 });

            const embed = EmbedHelper.success(
                '✅ User Banned',
                `**User:** ${member.user.tag}\n**Reason:** ${reason}`
            );
            await message.reply({ embeds: [embed] }).catch(() => {});

            // Log if log channel is configured
            const config = await this.getConfig(message.guild.id);
            if (config.logChannel) {
                const logChannel = message.guild.channels.cache.get(config.logChannel);
                if (logChannel) {
                    const logEmbed = EmbedHelper.error(
                        '🔨 User Banned',
                        `**User:** ${member.user.tag} (${member.id})\n**Moderator:** ${message.author.tag}\n**Reason:** ${reason}\n**Channel:** ${message.channel.name}`
                    );
                    await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            }

        } catch (error) {
            console.error('Error banning user:', error);
            const embed = EmbedHelper.error(
                '❌ Ban Failed',
                'An error occurred while trying to ban the user.'
            );
            await message.reply({ embeds: [embed] }).catch(() => {});
        }
    }
}

module.exports = BanCommand;
