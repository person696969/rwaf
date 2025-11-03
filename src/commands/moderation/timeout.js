const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');

class TimeoutCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'timeout';
        this.description = 'Timeout a user';
        this.usage = 'n!timeout @user <10m|1h|1d> [reason]';
        this.aliases = ['mute', 'tempmute'];
        this.adminOnly = true;
        this.requiredPermission = PermissionFlagsBits.ModerateMembers;
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

        if (!args[1]) {
            const embed = EmbedHelper.error(
                '❌ Missing Duration',
                `**Usage:** ${this.usage}\n\n**Examples:**\n\`n!timeout @user 10m Spamming\`\n\`n!timeout @user 1h Toxic behavior\`\n\`n!timeout @user 1d Repeated violations\``
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        if (member.id === message.author.id) {
            const embed = EmbedHelper.error(
                '❌ Invalid Target',
                'You cannot timeout yourself.'
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        if (member.id === this.bot.client.user.id) {
            const embed = EmbedHelper.error(
                '❌ Invalid Target',
                'I cannot timeout myself.'
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        if (!member.moderatable) {
            const embed = EmbedHelper.error(
                '❌ Cannot Timeout',
                'I don\'t have permission to timeout this user. They may have a higher role than me.'
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        if (member.roles.highest.position >= message.member.roles.highest.position) {
            const embed = EmbedHelper.error(
                '❌ Insufficient Permissions',
                'You cannot timeout someone with an equal or higher role.'
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        // Parse duration
        const duration = args[1];
        const durationMs = this.parseDuration(duration);

        if (!durationMs) {
            const embed = EmbedHelper.error(
                '❌ Invalid Duration',
                'Duration must be in format: `10m`, `1h`, or `1d`\n\n**Maximum:** 28 days'
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        if (durationMs > 28 * 24 * 60 * 60 * 1000) {
            const embed = EmbedHelper.error(
                '❌ Duration Too Long',
                'Maximum timeout duration is 28 days.'
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        const reason = args.slice(2).join(' ') || 'No reason provided';

        try {
            // DM user before timeout
            const dmEmbed = EmbedHelper.warning(
                '⏱️ You Have Been Timed Out',
                `**Server:** ${message.guild.name}\n**Duration:** ${duration}\n**Reason:** ${reason}\n**Moderator:** ${message.author.tag}`
            );
            await member.send({ embeds: [dmEmbed] }).catch(() => {});

            // Apply timeout
            await member.timeout(durationMs, reason);

            const embed = EmbedHelper.success(
                '✅ User Timed Out',
                `**User:** ${member.user.tag}\n**Duration:** ${duration}\n**Reason:** ${reason}`
            );
            await message.reply({ embeds: [embed] }).catch(() => {});

            // Log if log channel is configured
            const config = await this.getConfig(message.guild.id);
            if (config.logChannel) {
                const logChannel = message.guild.channels.cache.get(config.logChannel);
                if (logChannel) {
                    const logEmbed = EmbedHelper.warning(
                        '⏱️ User Timed Out',
                        `**User:** ${member.user.tag} (${member.id})\n**Moderator:** ${message.author.tag}\n**Duration:** ${duration}\n**Reason:** ${reason}\n**Channel:** ${message.channel.name}`
                    );
                    await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            }

        } catch (error) {
            console.error('Error timing out user:', error);
            const embed = EmbedHelper.error(
                '❌ Timeout Failed',
                'An error occurred while trying to timeout the user.'
            );
            await message.reply({ embeds: [embed] }).catch(() => {});
        }
    }

    parseDuration(duration) {
        const match = duration.match(/^(\d+)([mhd])$/);
        if (!match) return null;
        
        const value = parseInt(match[1]);
        const unit = match[2];
        
        switch (unit) {
            case 'm': return value * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            case 'd': return value * 24 * 60 * 60 * 1000;
            default: return null;
        }
    }
}

module.exports = TimeoutCommand;
