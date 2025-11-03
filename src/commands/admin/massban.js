const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');

class MassBanCommand extends BaseCommand {
    constructor(bot) {
        super(bot, {
            name: 'massban',
            description: 'Ban multiple users at once (use with caution)',
            usage: 'massban <user1> <user2> <user3> ... [reason]',
            category: 'admin',
            adminOnly: true,
            requiredPermission: PermissionFlagsBits.BanMembers
        });
    }

    async execute(message, args) {
        if (args.length === 0) {
            return message.reply({
                embeds: [EmbedHelper.error(
                    '❌ No Users Specified',
                    `Usage: \`${this.usage}\`\n\n` +
                    '**Example:** `massban @user1 @user2 123456789 Spam bots`\n' +
                    '*You can mention users or use their IDs*'
                )]
            });
        }

        const userIds = [];
        const reasonIndex = args.findIndex(arg => !arg.match(/^<@!?\d+>$/) && !arg.match(/^\d+$/));
        const reason = reasonIndex !== -1 ? args.slice(reasonIndex).join(' ') : 'Mass ban';

        const argsToProcess = reasonIndex !== -1 ? args.slice(0, reasonIndex) : args;

        for (const arg of argsToProcess) {
            const id = arg.replace(/[<@!>]/g, '');
            if (id.match(/^\d+$/)) {
                userIds.push(id);
            }
        }

        if (userIds.length === 0) {
            return message.reply({
                embeds: [EmbedHelper.error('❌ No Valid Users', 'Please provide at least one valid user mention or ID')]
            });
        }

        if (userIds.length > 10) {
            return message.reply({
                embeds: [EmbedHelper.error('❌ Too Many Users', 'Maximum 10 users can be banned at once')]
            });
        }

        const confirmEmbed = EmbedHelper.warning(
            '⚠️ Mass Ban Confirmation',
            `You are about to ban **${userIds.length}** user(s)\n\n` +
            `**Reason:** ${reason}\n\n` +
            `React with ✅ to confirm or ❌ to cancel\n` +
            `*This action cannot be undone!*`
        );

        const confirmMessage = await message.reply({ embeds: [confirmEmbed] });
        await confirmMessage.react('✅');
        await confirmMessage.react('❌');

        const filter = (reaction, user) => {
            return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
        };

        try {
            const collected = await confirmMessage.awaitReactions({ 
                filter, 
                max: 1, 
                time: 30000, 
                errors: ['time'] 
            });

            const reaction = collected.first();

            if (reaction.emoji.name === '❌') {
                return confirmMessage.edit({
                    embeds: [EmbedHelper.error('❌ Cancelled', 'Mass ban operation has been cancelled')]
                });
            }

            const results = {
                success: [],
                failed: []
            };

            for (const userId of userIds) {
                try {
                    const member = await message.guild.members.fetch(userId).catch(() => null);
                    
                    if (member) {
                        if (member.id === message.author.id) {
                            results.failed.push({ id: userId, reason: 'Cannot ban yourself' });
                            continue;
                        }
                        
                        if (member.id === this.bot.client.user.id) {
                            results.failed.push({ id: userId, reason: 'Cannot ban the bot' });
                            continue;
                        }

                        if (!member.bannable) {
                            results.failed.push({ id: userId, reason: 'User is not bannable' });
                            continue;
                        }
                    }

                    await message.guild.members.ban(userId, { reason: reason });
                    results.success.push(userId);

                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                } catch (error) {
                    results.failed.push({ id: userId, reason: error.message });
                }
            }

            const Models = require('../../database/models/Config').Models;
            const models = new Models(this.bot.dbManager);
            await models.stats.increment('bansIssued');

            const resultEmbed = EmbedHelper.success(
                '✅ Mass Ban Complete',
                `**Successful Bans:** ${results.success.length}\n` +
                `**Failed:** ${results.failed.length}\n\n` +
                `**Reason:** ${reason}`
            );

            if (results.failed.length > 0) {
                const failedList = results.failed
                    .slice(0, 5)
                    .map(f => `<@${f.id}>: ${f.reason}`)
                    .join('\n');
                
                resultEmbed.addFields([{
                    name: '❌ Failed Bans',
                    value: failedList + (results.failed.length > 5 ? `\n... and ${results.failed.length - 5} more` : ''),
                    inline: false
                }]);
            }

            const config = await models.guildConfig.get(message.guild.id) || {};
            if (config.logChannel) {
                const logChannel = await message.guild.channels.fetch(config.logChannel).catch(() => null);
                if (logChannel) {
                    await logChannel.send({ embeds: [resultEmbed] }).catch(() => {});
                }
            }

            return confirmMessage.edit({ embeds: [resultEmbed] });

        } catch (error) {
            return confirmMessage.edit({
                embeds: [EmbedHelper.error('⏱️ Timeout', 'Mass ban operation timed out (no response)')]
            });
        }
    }
}

module.exports = MassBanCommand;
