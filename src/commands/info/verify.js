const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config/constants');

class VerifyCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'verify';
        this.description = 'Check if a message contains toxic content';
        this.usage = 'n!verify <message>';
        this.aliases = ['check', 'test', 'analyze'];
    }

    async execute(message, args) {
        const textToVerify = args.join(' ');
        
        if (!textToVerify || textToVerify.trim().length === 0) {
            const embed = EmbedHelper.error(
                '❌ No Text Provided',
                '**Usage:** `n!verify <message>`\n\n**Example:**\n`n!verify this is a test message`\n\nThis command checks if your message would be flagged as toxic.\n\n*Note: Messages will be deleted in 15 seconds for privacy.*'
            );
            
            return message.reply({ embeds: [embed] }).then(msg => {
                setTimeout(() => {
                    msg.delete().catch(() => {});
                    message.delete().catch(() => {});
                }, 15000);
            }).catch(() => {});
        }
        
        // Create temporary message object for analysis
        const tempMessage = {
            content: textToVerify,
            author: message.author,
            guild: message.guild,
            channel: message.channel,
            member: message.member,
            id: message.id,
            attachments: new Map(),
            mentions: { users: new Map() }
        };
        
        const verifyEmbed = EmbedHelper.warning(
            '🔍 Analyzing Message...',
            'Running comprehensive toxicity analysis...\n\n⏱️ This may take a few seconds.'
        );
        
        const verifyMsg = await message.reply({ embeds: [verifyEmbed] }).catch(() => null);
        if (!verifyMsg) return;
        
        try {
            // Perform verification with full toxicity detection
            const ToxicityDetector = require('../../detectors/toxicityDetector');
            const detector = new ToxicityDetector(this.bot);
            const result = await detector.analyze(tempMessage, true);
            
            if (!result) {
                const errorEmbed = EmbedHelper.error(
                    '❌ Analysis Failed',
                    'Could not analyze the message. Please try again.'
                );
                await verifyMsg.edit({ embeds: [errorEmbed] }).catch(() => {});
                setTimeout(() => {
                    verifyMsg.delete().catch(() => {});
                    message.delete().catch(() => {});
                }, 15000);
                return;
            }

            // Get config for threshold
            const config = await this.getConfig(message.guild.id);
            const threshold = config.thresholds?.toxicity || 0.75;

            // Calculate max score
            const maxScore = Math.max(
                result.toxicity || 0,
                result.severeToxicity || 0,
                result.threat || 0,
                result.profanity || 0,
                result.identityAttack || 0,
                result.insult || 0,
                result.explicitContent || 0
            );

            const wouldBeBlocked = result.shouldBlock || maxScore >= threshold;

            // Create detailed result embed
            let resultEmbed;
            
            if (wouldBeBlocked) {
                resultEmbed = new EmbedBuilder()
                    .setTitle('🚨 Toxicity Detected')
                    .setColor(COLORS.ERROR)
                    .setDescription(`**Status:** ❌ Would be **BLOCKED**\n**Severity:** ${maxScore >= 0.9 ? 'Severe' : maxScore >= 0.8 ? 'High' : maxScore >= 0.7 ? 'Moderate' : 'Low'}`)
                    .addFields(
                        {
                            name: '📊 Detailed Scores',
                            value: `\`\`\`
Toxicity:        ${(result.toxicity * 100).toFixed(1)}%
Severe Toxicity: ${(result.severeToxicity * 100).toFixed(1)}%
Threat:          ${(result.threat * 100).toFixed(1)}%
Profanity:       ${(result.profanity * 100).toFixed(1)}%
Insult:          ${(result.insult * 100).toFixed(1)}%
Identity Attack: ${(result.identityAttack * 100).toFixed(1)}%
Explicit:        ${(result.explicitContent * 100).toFixed(1)}%
───────────────────────────
Threshold:       ${(threshold * 100).toFixed(1)}%
Maximum Score:   ${(maxScore * 100).toFixed(1)}%\`\`\``,
                            inline: false
                        }
                    );

                if (result.reason && result.reason.length > 0) {
                    resultEmbed.addFields({
                        name: '🔍 Detection Reasons',
                        value: result.reason.join('\n• '),
                        inline: false
                    });
                }

                resultEmbed.addFields({
                    name: '💡 Recommendation',
                    value: '• Consider rephrasing to be more respectful\n• Avoid profanity, threats, and insults\n• Use positive language',
                    inline: false
                });

            } else {
                resultEmbed = new EmbedBuilder()
                    .setTitle('✅ Message Verified')
                    .setColor(COLORS.SUCCESS)
                    .setDescription(`**Status:** ✅ Would be **ALLOWED**\n**Safety Level:** ${maxScore < 0.3 ? 'Very Safe' : maxScore < 0.5 ? 'Safe' : 'Borderline'}`)
                    .addFields(
                        {
                            name: '📊 Detailed Scores',
                            value: `\`\`\`
Toxicity:        ${(result.toxicity * 100).toFixed(1)}%
Severe Toxicity: ${(result.severeToxicity * 100).toFixed(1)}%
Threat:          ${(result.threat * 100).toFixed(1)}%
Profanity:       ${(result.profanity * 100).toFixed(1)}%
Insult:          ${(result.insult * 100).toFixed(1)}%
Identity Attack: ${(result.identityAttack * 100).toFixed(1)}%
Explicit:        ${(result.explicitContent * 100).toFixed(1)}%
───────────────────────────
Threshold:       ${(threshold * 100).toFixed(1)}%
Maximum Score:   ${(maxScore * 100).toFixed(1)}%\`\`\``,
                            inline: false
                        }
                    );

                if (maxScore > 0.5) {
                    resultEmbed.addFields({
                        name: '⚠️ Note',
                        value: 'Message is safe but approaching threshold. Consider slight adjustments.',
                        inline: false
                    });
                }
            }

            resultEmbed.setFooter({ text: '⏱️ This message will be deleted in 15 seconds for privacy' });
            resultEmbed.setTimestamp();
            
            await verifyMsg.edit({ embeds: [resultEmbed] }).catch(() => {});
            
        } catch (error) {
            console.error('Error in verify command:', error);
            const errorEmbed = EmbedHelper.error(
                '❌ Analysis Error',
                'An unexpected error occurred during analysis.'
            );
            await verifyMsg.edit({ embeds: [errorEmbed] }).catch(() => {});
        }
        
        // Delete messages after 15 seconds
        setTimeout(() => {
            verifyMsg.delete().catch(() => {});
            message.delete().catch(() => {});
        }, 15000);
    }
}

module.exports = VerifyCommand;
