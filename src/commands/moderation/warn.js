const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');

class WarnCommand extends BaseCommand {
    constructor(bot) {
        super(bot, {
            name: 'warn',
            description: 'Issue a warning to a user',
            usage: 'warn <@user> [reason]',
            category: 'moderation',
            adminOnly: true,
            requiredPermission: PermissionFlagsBits.ModerateMembers
        });
    }

    async execute(message, args) {
        const Models = require('../../database/models/Config').Models;
        const models = new Models(this.bot.dbManager);

        const member = message.mentions.members?.first() || 
                      await message.guild.members.fetch(args[0]).catch(() => null);

        if (!member) {
            return message.reply({
                embeds: [EmbedHelper.error('❌ Invalid User', 'Please mention a valid user')]
            });
        }

        if (member.id === message.author.id) {
            return message.reply({
                embeds: [EmbedHelper.error('❌ Invalid Action', 'You cannot warn yourself')]
            });
        }

        if (member.id === this.bot.client.user.id) {
            return message.reply({
                embeds: [EmbedHelper.error('❌ Invalid Action', 'Nice try! 😄')]
            });
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';

        const strikes = await models.strikes.add(message.guild.id, member.id);

        const warnEmbed = EmbedHelper.warning(
            '⚠️ Warning Issued',
            `**User**: ${member.user.tag}\n` +
            `**Reason**: ${reason}\n` +
            `**Total Strikes**: ${strikes}\n` +
            `**Warned By**: ${message.author.tag}`
        );

        const config = await models.guildConfig.get(message.guild.id) || {};
        
        if (config.logChannel) {
            const logChannel = await message.guild.channels.fetch(config.logChannel).catch(() => null);
            if (logChannel) {
                await logChannel.send({ embeds: [warnEmbed] }).catch(() => {});
            }
        }

        try {
            await member.send({
                embeds: [EmbedHelper.warning(
                    '⚠️ Warning',
                    `You have been warned in **${message.guild.name}**\n\n**Reason**: ${reason}\n**Total Strikes**: ${strikes}`
                )]
            }).catch(() => {});
        } catch (error) {
            console.log('Could not DM user');
        }

        await models.stats.increment('warningsIssued');

        return message.reply({ embeds: [warnEmbed] });
    }
}

module.exports = WarnCommand;
