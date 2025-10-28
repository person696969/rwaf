/**
 * Config Command
 * Displays the current guild configuration
 */

const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config/constants');

module.exports = {
    name: 'config',
    description: 'View current server configuration',
    usage: 'n!config',
    aliases: ['configuration', 'settings', 'view'],
    category: 'admin',
    adminOnly: true,
    cooldown: 3,

    async execute(message, args, { config }) {
        try {
            const configEmbed = new EmbedBuilder()
                .setTitle('⚙️ Server Configuration')
                .setDescription('Current anti-toxicity system settings')
                .setColor(config.enabled ? COLORS.SUCCESS : COLORS.ERROR)
                .addFields(
                    {
                        name: '🔧 System Status',
                        value: config.enabled ? '✅ **Enabled**' : '❌ **Disabled**',
                        inline: true
                    },
                    {
                        name: '📊 Threshold',
                        value: `**${config.threshold}/10** (${(config.threshold * 10).toFixed(1)}%)`,
                        inline: true
                    },
                    {
                        name: '⚡ Max Strikes',
                        value: `**${config.maxStrikes}** strikes`,
                        inline: true
                    },
                    {
                        name: '⚖️ Punishment',
                        value: `**${config.punishment.toUpperCase()}**`,
                        inline: true
                    },
                    {
                        name: '⏱️ Timeout Duration',
                        value: config.punishment === 'timeout' ? `**${config.timeoutDuration}**` : 'N/A',
                        inline: true
                    },
                    {
                        name: '🔄 API Rate Limit',
                        value: `**${config.rateLimit}** calls/min`,
                        inline: true
                    },
                    {
                        name: '📝 Log Channel',
                        value: config.logChannel ? `<#${config.logChannel}>` : '❌ Not set',
                        inline: true
                    },
                    {
                        name: '👥 Whitelisted Users',
                        value: `**${config.whitelist.length}** users`,
                        inline: true
                    },
                    {
                        name: '🚫 Blacklisted Words',
                        value: `**${config.blacklistWords.length}** words`,
                        inline: true
                    },
                    {
                        name: '✅ Whitelisted Words',
                        value: `**${config.whitelistWords.length}** words`,
                        inline: true
                    },
                    {
                        name: '🖼️ Image Detection',
                        value: config.imageDetection ? '✅ Enabled' : '❌ Disabled',
                        inline: true
                    },
                    {
                        name: '📚 Context Analysis',
                        value: config.contextAnalysis ? '✅ Enabled' : '❌ Disabled',
                        inline: true
                    },
                    {
                        name: '🛡️ Anti-Bypass',
                        value: config.antiBypass ? '✅ Enabled' : '❌ Disabled',
                        inline: true
                    },
                    {
                        name: '🔍 Deep Context',
                        value: config.deepContextAnalysis ? '✅ Enabled' : '❌ Disabled',
                        inline: true
                    },
                    {
                        name: '🚨 Spam Protection',
                        value: config.spamProtection ? '✅ Enabled' : '❌ Disabled',
                        inline: true
                    },
                    {
                        name: '🔗 Link Protection',
                        value: config.linkProtection ? '✅ Enabled' : '❌ Disabled',
                        inline: true
                    },
                    {
                        name: '👥 Mention Spam',
                        value: config.mentionSpamProtection ? '✅ Enabled' : '❌ Disabled',
                        inline: true
                    }
                )
                .setFooter({ 
                    text: `Server: ${message.guild.name} | Use n!configspam and n!configmentions for detailed settings` 
                })
                .setTimestamp();

            // Add guild icon if available
            if (message.guild.iconURL()) {
                configEmbed.setThumbnail(message.guild.iconURL({ dynamic: true }));
            }

            // Add spam protection details
            if (config.spamProtection) {
                configEmbed.addFields({
                    name: '📊 Spam Settings',
                    value: `Max Messages: **${config.spamMaxMessages}** in **${config.spamTimeWindow}ms**\nMax Strikes: **${config.spamMaxStrikes}**\nPunishment: **${config.spamPunishment.toUpperCase()}**`,
                    inline: false
                });
            }

            // Add mention spam details
            if (config.mentionSpamProtection) {
                configEmbed.addFields({
                    name: '👥 Mention Spam Settings',
                    value: `Max Mentions: **${config.mentionSpamMaxMentions}**\nMax Strikes: **${config.mentionSpamMaxStrikes}**\nPunishment: **${config.mentionSpamPunishment.toUpperCase()}**`,
                    inline: false
                });
            }

            await message.reply({ embeds: [configEmbed] });

        } catch (error) {
            console.error('Error in config command:', error);

            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Error')
                .setDescription('Failed to retrieve configuration. Please try again.')
                .setColor(COLORS.ERROR)
                .setTimestamp();

            await message.reply({ embeds: [errorEmbed] }).catch(() => {});
        }
    }
};