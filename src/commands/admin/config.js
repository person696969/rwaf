const BaseCommand = require('../BaseCommand');
const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config/constants');
const { PermissionFlagsBits } = require('discord.js');

class ConfigCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'config';
        this.description = 'View current server configuration';
        this.usage = 'n!config';
        this.aliases = ['configuration', 'settings', 'view'];
        this.adminOnly = true;
        this.requiredPermission = PermissionFlagsBits.Administrator;
    }

    async execute(message, args) {
        try {
            const config = await this.getConfig(message.guild.id);
            
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
                        value: config.thresholds ? `**${(config.thresholds.toxicity * 10).toFixed(1)}/10**` : 'Default',
                        inline: true
                    },
                    {
                        name: '⚡ Max Strikes',
                        value: `**${config.maxStrikes || 3}** strikes`,
                        inline: true
                    },
                    {
                        name: '📝 Log Channel',
                        value: config.logChannel ? `<#${config.logChannel}>` : '❌ Not set',
                        inline: true
                    },
                    {
                        name: '👥 Whitelisted Users',
                        value: `**${config.whitelist?.length || 0}** users`,
                        inline: true
                    },
                    {
                        name: '🚫 Blacklisted Words',
                        value: `**${config.blacklistWords?.length || 0}** words`,
                        inline: true
                    },
                    {
                        name: '✅ Whitelisted Words',
                        value: `**${config.whitelistWords?.length || 0}** words`,
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
                    },
                    {
                        name: '🤖 Auto-Moderation',
                        value: config.autoModeration ? '✅ Enabled' : '❌ Disabled',
                        inline: true
                    }
                )
                .setFooter({ text: `Server: ${message.guild.name} | Use n!help for command list` })
                .setTimestamp();

            if (message.guild.iconURL()) {
                configEmbed.setThumbnail(message.guild.iconURL({ dynamic: true }));
            }

            // Show punishment configuration
            if (config.punishments) {
                let punishmentText = '';
                for (let i = 1; i <= Math.min(5, Object.keys(config.punishments).length); i++) {
                    if (config.punishments[i]) {
                        punishmentText += `Strike ${i}: **${config.punishments[i].toUpperCase()}**\n`;
                    }
                }
                if (punishmentText) {
                    configEmbed.addFields({
                        name: '⚖️ Punishment Ladder',
                        value: punishmentText,
                        inline: false
                    });
                }
            }

            await message.reply({ embeds: [configEmbed] });

        } catch (error) {
            console.error('Error in config command:', error);
            const { EmbedHelper } = require('../../utils/embedBuilder');
            const errorEmbed = EmbedHelper.error(
                '❌ Error',
                'Failed to retrieve configuration. Please try again.'
            );
            await message.reply({ embeds: [errorEmbed] }).catch(() => {});
        }
    }
}

module.exports = ConfigCommand;
