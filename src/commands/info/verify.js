const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config/constants');

class VerifyCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'verify';
        this.description = 'Test message detection';
        this.usage = 'n!verify <message>';
    }

    async execute(message, args) {
        const textToVerify = args.join(' ');
        
        if (!textToVerify || textToVerify.trim().length === 0) {
            const embed = EmbedHelper.error(
                '❌ No Text Provided',
                '**Usage:** `n!verify <message>`\n\n**Example:**\n`n!verify this is a test message`\n\n**Note:** This message will be deleted in 15 seconds.'
            );
            
            return message.reply({ embeds: [embed] }).then(msg => {
                setTimeout(() => {
                    msg.delete().catch(() => {});
                    message.delete().catch(() => {});
                }, 15000);
            }).catch(() => {});
        }
        
        // Create temporary message object
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
            'Please wait while we analyze your message.\n\n⏱️ This may take a few seconds.'
        );
        
        const verifyMsg = await message.reply({ embeds: [verifyEmbed] }).catch(() => null);
        if (!verifyMsg) return;
        
        // Perform verification
        const ToxicityDetector = require('../../detectors/toxicityDetector');
        const detector = new ToxicityDetector(this.bot);
        const result = await detector.analyze(tempMessage, true);
        
        let resultEmbed;
        
        if (result && result.error) {
            resultEmbed = EmbedHelper.error(
                '❌ Analysis Error',
                `Could not analyze the message.\n**Error:** ${result.message}\n\n⏱️ This message will be deleted in 15 seconds.`
            );
        } else if (result && result.safe) {
            resultEmbed = new EmbedBuilder()
                .setTitle('✅ Message Verification Result')
                .setColor(COLORS.SUCCESS)
                .setDescription(`**Status:** Safe to send\n**Reason:** ${result.reason}`)
                .setFooter({ text: '⏱️ This message will be deleted in 15 seconds' })
                .setTimestamp();
            
            if (result.scores) {
                resultEmbed.addFields({
                    name: '📊 Toxicity Scores',
                    value: `\`\`\`\nToxicity:        ${(result.scores.toxicity * 100).toFixed(1)}%\nSevere Toxicity: ${(result.scores.severeToxicity * 100).toFixed(1)}%\nThreat:          ${(result.scores.threat * 100).toFixed(1)}%\nInsult:          ${(result.scores.insult * 100).toFixed(1)}%\nProfanity:       ${(result.scores.profanity * 100).toFixed(1)}%\nIdentity Attack: ${(result.scores.identityAttack * 100).toFixed(1)}%${result.threshold ? `\nThreshold:       ${(result.threshold * 100).toFixed(1)}%` : ''}\`\`\``,
                    inline: false
                });
            }
        } else if (result && result.toxic) {
            resultEmbed = new EmbedBuilder()
                .setTitle('🚨 Message Verification Result')
                .setColor(COLORS.ERROR)
                .setDescription(`**Status:** Would be flagged as toxic\n**Reason:** ${result.reason}${result.details ? `\n**Details:** ${result.details}` : ''}`)
                .setFooter({ text: '⏱️ This message will be deleted in 15 seconds' })
                .setTimestamp();
            
            if (result.scores) {
                resultEmbed.addFields({
                    name: '📊 Toxicity Scores',
                    value: `\`\`\`\nToxicity:        ${(result.scores.toxicity * 100).toFixed(1)}%\nSevere Toxicity: ${(result.scores.severeToxicity * 100).toFixed(1)}%\nThreat:          ${(result.scores.threat * 100).toFixed(1)}%\nInsult:          ${(result.scores.insult * 100).toFixed(1)}%\nProfanity:       ${(result.scores.profanity * 100).toFixed(1)}%\nIdentity Attack: ${(result.scores.identityAttack * 100).toFixed(1)}%${result.threshold ? `\nThreshold:       ${(result.threshold * 100).toFixed(1)}%` : ''}\`\`\``,
                    inline: false
                });
            }
            
            resultEmbed.addFields({
                name: '💡 Recommendation',
                value: 'Consider rephrasing your message to be more respectful.',
                inline: false
            });
        } else {
            resultEmbed = EmbedHelper.success(
                '✅ Message Verification Result',
                '**Status:** Message appears safe\n\n⏱️ This message will be deleted in 15 seconds.'
            );
        }
        
        await verifyMsg.edit({ embeds: [resultEmbed] }).catch(() => {});
        
        // Delete messages after 15 seconds
        setTimeout(() => {
            verifyMsg.delete().catch(() => {});
            message.delete().catch(() => {});
        }, 15000);
    }
}

module.exports = VerifyCommand;