/**
 * Toggle Command
 * Toggles various protection features on/off
 */

const { EmbedBuilder } = require('discord.js');
const { COLORS, VALID_FEATURES, FEATURE_MAP } = require('../../config/constants');

module.exports = {
    name: 'toggle',
    description: 'Toggle protection features on/off',
    usage: 'n!toggle <feature>',
    examples: [
        'n!toggle image',
        'n!toggle antibypass',
        'n!toggle spam'
    ],
    aliases: ['switch', 'feature'],
    category: 'admin',
    adminOnly: true,
    cooldown: 3,

    async execute(message, args, { models, config }) {
        try {
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
                    .setTimestamp()
                    .setFooter({ text: 'Powered by NeoBot' });

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
            await models.guildConfig.set(message.guild.id, config);

            // Feature descriptions
            const featureDescriptions = {
                image: 'Analyzes images for toxic text using OCR technology.',
                context: 'Uses historical message patterns to improve detection.',
                antibypass: 'Detects toxic content split across multiple messages.',
                deepcontext: 'Analyzes gaming/entertainment context for context-aware detection.',
                spam: 'Prevents message spam and flooding.',
                links: 'Blocks all links and suspicious URLs.',
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
                        name: '📊 Status',
                        value: `${oldValue ? '✅' : '❌'} → ${newValue ? '✅' : '❌'}`,
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({ text: 'Powered by NeoBot' });

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
                    value: newValue ? 'All links will be blocked. Consider whitelisting trusted users.' : 'Links are now allowed again.',
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

            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Error')
                .setDescription('Failed to toggle feature. Please try again.')
                .setColor(COLORS.ERROR)
                .setTimestamp();

            await message.reply({ embeds: [errorEmbed] }).catch(() => {});
        }
    }
};