const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');

class CheckUrlCommand extends BaseCommand {
    constructor(bot) {
        super(bot, {
            name: 'checkurl',
            description: 'Check if a URL is safe (phishing/malware detection)',
            usage: 'checkurl <url>',
            category: 'info',
            aliases: ['urlcheck', 'safelink']
        });
    }

    async execute(message, args) {
        if (args.length === 0) {
            return message.reply({
                embeds: [EmbedHelper.error(
                    '❌ No URL Provided',
                    `Usage: \`${this.usage}\`\n\nProvide a URL to check for phishing and malware`
                )]
            });
        }

        const url = args[0];

        if (!url.match(/^(https?:\/\/|www\.)/i)) {
            return message.reply({
                embeds: [EmbedHelper.error('❌ Invalid URL', 'Please provide a valid URL starting with http://, https://, or www.')]
            });
        }

        const loadingEmbed = EmbedHelper.info(
            '🔍 Checking URL...',
            'Please wait while I scan this URL for threats'
        );
        const loadingMsg = await message.reply({ embeds: [loadingEmbed] });

        try {
            const result = await this.bot.phishingDetectionService.checkUrl(url);

            let resultEmbed;

            if (result.isPhishing || result.isMalware) {
                resultEmbed = EmbedHelper.error(
                    '🚨 THREAT DETECTED',
                    `**URL:** ${url}\n\n` +
                    `**Status:** ${result.isPhishing ? '⚠️ Phishing' : '⚠️ Malware'}\n` +
                    `**Confidence:** ${(result.confidence * 100).toFixed(1)}%\n` +
                    `**Detection Source:** ${result.source}\n\n` +
                    `⚠️ **WARNING:** Do not visit this link!`
                );
                resultEmbed.setColor('#FF0000');

                if (result.details) {
                    if (result.details.psafe?.category) {
                        resultEmbed.addFields([{
                            name: '📋 Details',
                            value: `**Category:** ${result.details.psafe.category}\n` +
                                   `**Method:** ${result.details.psafe.method}`,
                            inline: false
                        }]);
                    }
                }
            } else {
                resultEmbed = EmbedHelper.success(
                    '✅ URL SAFE',
                    `**URL:** ${url}\n\n` +
                    `**Status:** ✅ No threats detected\n` +
                    `**Scanned By:** anti-phish-advanced & PSafe API\n\n` +
                    `*This URL appears to be safe based on current threat databases*`
                );

                resultEmbed.addFields([{
                    name: '⚠️ Disclaimer',
                    value: 'While this URL appears safe now, always exercise caution when clicking links. ' +
                           'Threats can emerge after scanning, and no scanner is 100% accurate.',
                    inline: false
                }]);
            }

            return loadingMsg.edit({ embeds: [resultEmbed] });

        } catch (error) {
            console.error('URL check error:', error);
            return loadingMsg.edit({
                embeds: [EmbedHelper.error(
                    '❌ Check Failed',
                    'An error occurred while checking this URL. Please try again later.'
                )]
            });
        }
    }
}

module.exports = CheckUrlCommand;
