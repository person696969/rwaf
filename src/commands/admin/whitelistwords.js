const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');

class WhitelistWordsCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'whitelistwords';
        this.description = 'Manage whitelisted words (exceptions)';
        this.usage = 'n!whitelistwords <add|remove|list> [word]';
        this.aliases = ['allowwords', 'exceptions'];
        this.adminOnly = true;
        this.requiredPermission = PermissionFlagsBits.Administrator;
    }

    async execute(message, args) {
        const config = await this.getConfig(message.guild.id);
        config.whitelistWords = config.whitelistWords || [];

        if (!args[0] || !['add', 'remove', 'list'].includes(args[0].toLowerCase())) {
            const embed = EmbedHelper.error(
                '❌ Invalid Usage',
                `**Usage:** ${this.usage}\n\n**Commands:**\n\`add\` - Add word to whitelist\n\`remove\` - Remove word from whitelist\n\`list\` - Show all whitelisted words\n\n**Note:** Whitelisted words bypass all toxicity detection.`
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        const action = args[0].toLowerCase();

        if (action === 'list') {
            if (config.whitelistWords.length === 0) {
                const embed = EmbedHelper.info(
                    '📋 Whitelist',
                    'No words are whitelisted. All content is subject to detection.'
                );
                return message.reply({ embeds: [embed] }).catch(() => {});
            }

            const embed = EmbedHelper.info(
                '📋 Whitelisted Words',
                `${config.whitelistWords.join(', ')}\n\n**Total:** ${config.whitelistWords.length} words\n\n*These words bypass toxicity detection*`
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        // For add/remove, we need a word
        if (!args[1]) {
            const embed = EmbedHelper.error(
                '❌ Missing Word',
                'Please provide a word to whitelist/remove.'
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        const word = args[1].toLowerCase();

        if (action === 'add') {
            if (config.whitelistWords.includes(word)) {
                const embed = EmbedHelper.warning(
                    '⚠️ Already Whitelisted',
                    'This word is already in the whitelist.'
                );
                return message.reply({ embeds: [embed] }).catch(() => {});
            }

            config.whitelistWords.push(word);
            await this.saveConfig(message.guild.id, config);

            const embed = EmbedHelper.success(
                '✅ Word Whitelisted',
                `Added to whitelist. This word will bypass toxicity detection.`
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        if (action === 'remove') {
            const index = config.whitelistWords.indexOf(word);
            if (index === -1) {
                const embed = EmbedHelper.warning(
                    '⚠️ Not Found',
                    'This word is not in the whitelist.'
                );
                return message.reply({ embeds: [embed] }).catch(() => {});
            }

            config.whitelistWords.splice(index, 1);
            await this.saveConfig(message.guild.id, config);

            const embed = EmbedHelper.success(
                '✅ Word Removed',
                `Removed from whitelist.`
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }
    }
}

module.exports = WhitelistWordsCommand;
