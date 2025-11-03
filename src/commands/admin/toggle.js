const BaseCommand = require('../BaseCommand');
const { EmbedBuilder } = require('discord.js');
const { COLORS, VALID_FEATURES, FEATURE_MAP } = require('../../config/constants');
const { PermissionFlagsBits } = require('discord.js');

class ToggleCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'toggle';
        this.description = 'Toggle protection features on/off';
        this.usage = 'n!toggle <feature>';
        this.aliases = ['switch', 'feature'];
        this.adminOnly = true;
        this.requiredPermission = PermissionFlagsBits.Administrator;
    }

    async execute(message, args) {
        try {
            const config = await this.getConfig(message.guild.id);
            
            // Show available features if no argument
            if (args.length === 0) {
                const helpEmbed = new EmbedBuilder()
                    .setTitle('🔧 Toggle Features')
                    .setDescription('Enable or disable protection features.')
                    .setColor(COLORS.INFO)
                    .addFields(
                        {
                            name: '📝 Usage',
                            value: '`n!toggle <feature>`',
                            inline: false
                        },
                        {
                            name: '🛡️ Available Features',
                            value: '• `image` - Image OCR detection\n• `context` - Historical context analysis\n• `antibypass` - Multi-line detection\n• `deepcontext` - Deep context analysis\n• `spam` - Spam protection\n• `links` - Link blocking\n• `mentions` - Mention spam protection\n• `automod` - Auto-moderation',
                            inline: false
                        },
                        {
                            name: '📊 Current Status',
                            value: `Image Detection: ${config.imageDetection ? '✅' : '❌'}\nContext Analysis: ${config.contextAnalysis ? '✅' : '❌'}\nAnti-Bypass: ${config.antiBypass ? '✅' : '❌'}\nDeep Context: ${config.deepContextAnalysis ? '✅' : '❌'}\nSpam Protection: ${config.spamProtection ? '✅' : '❌'}\nLink Protection: ${config.linkProtection ? '✅' : '❌'}\nMention Spam: ${config.mentionSpamProtection ? '✅' : '❌'}\nAuto-Moderation: ${config.autoModeration ? '✅' : '❌'}`,
                            inline: false
                        }
                    )
                    .setTimestamp();

                return message.reply({ embeds: [helpEmbed] });
            }

            const feature = args[0].toLowerCase();

            // Validate feature
            if (!VALID_FEATURES.includes(feature)) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Invalid Feature')
                    .setDescription('Please specify a valid feature to toggle.')
                    .setColor(COLORS.ERROR)
                    .addFields({
                        name: '🛡️ Valid Features',
                        value: VALID_FEATURES.map(f => `\`${f}\``).join(', ')
                    })
                    .setTimestamp();

                return message.reply({ embeds: [errorEmbed] });
            }

            // Get feature config key
            const featureName = FEATURE_MAP[feature];
            const oldValue = config[featureName];
            const newValue = !oldValue;

            // Update configuration
            config[featureName] = newValue;
            await this.saveConfig(message.guild.id, config);

            // Feature descriptions
            const featureDescriptions = {
                image: 'Analyzes images for toxic text using OCR technology.',
                context: 'Uses historical message patterns to improve detection.',
                antibypass: 'Detects toxic content split across multiple messages.',
                deepcontext: 'Analyzes gaming/entertainment context for context-aware detection.',
                spam: 'Prevents message spam and flooding.',
                links: 'Blocks suspicious links and phishing attempts.',
                mentions: 'Prevents excessive user mentions.',
                automod: 'Automatically applies moderation actions.'
            };

            const successEmbed = new EmbedBuilder()
                .setTitle(`✅ Feature ${newValue ? 'Enabled' : 'Disabled'}`)
                .setDescription(`**${feature.charAt(0).toUpperCase() + feature.slice(1)}** protection is now **${newValue ? 'enabled' : 'disabled'}**.`)
                .setColor(newValue ? COLORS.SUCCESS : COLORS.WARNING)
                .addFields(
                    {
                        name: '📋 Description',
                        value: featureDescriptions[feature] || 'Protection feature',
                        inline: false
                    },
                    {
                        name: '📊 Status Change',
                        value: `${oldValue ? '✅' : '❌'} → ${newValue ? '✅' : '❌'}`,
                        inline: true
                    }
                )
                .setTimestamp();

            // Add feature-specific notes
            if (feature === 'deepcontext') {
                successEmbed.addFields({
                    name: '💡 Note',
                    value: 'Deep context analysis checks for gaming, entertainment, and news context to reduce false positives.',
                    inline: false
                });
            } else if (feature === 'antibypass') {
                successEmbed.addFields({
                    name: '💡 Note',
                    value: 'Smart multi-line detection analyzes related short messages to detect bypass attempts.',
                    inline: false
                });
            } else if (feature === 'links') {
                successEmbed.addFields({
                    name: '⚠️ Warning',
                    value: newValue ? 'Suspicious links will be blocked. Legitimate links are usually allowed.' : 'Link protection is now disabled.',
                    inline: false
                });
            }

            await message.reply({ embeds: [successEmbed] });

            // Log to log channel
            if (config.logChannel) {
                const logChannel = message.guild.channels.cache.get(config.logChannel);
                if (logChannel && logChannel.isTextBased()) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('🔧 Feature Toggled')
                        .setDescription(`**${feature}** ${newValue ? 'enabled' : 'disabled'} by ${message.author}`)
                        .setColor(newValue ? COLORS.SUCCESS : COLORS.WARNING)
                        .setTimestamp();

                    await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            }

        } catch (error) {
            console.error('Error in toggle command:', error);
            const { EmbedHelper } = require('../../utils/embedBuilder');
            const errorEmbed = EmbedHelper.error(
                '❌ Error',
                'Failed to toggle feature. Please try again.'
            );
            await message.reply({ embeds: [errorEmbed] }).catch(() => {});
        }
    }
}

module.exports = ToggleCommand;
