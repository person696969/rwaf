const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');

class BlacklistCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'blacklist';
        this.description = 'Manage blacklisted words';
        this.usage = 'n!blacklist <add|remove|list> [word]';
        this.aliases = ['blacklistwords', 'bannedwords'];
        this.adminOnly = true;
        this.requiredPermission = PermissionFlagsBits.Administrator;
    }

    async execute(message, args) {
        const config = await this.getConfig(message.guild.id);
        config.blacklistWords = config.blacklistWords || [];

        if (!args[0] || !['add', 'remove', 'list'].includes(args[0].toLowerCase())) {
            const embed = EmbedHelper.error(
                '❌ Invalid Usage',
                `**Usage:** ${this.usage}\n\n**Commands:**\n\`add\` - Add word to blacklist\n\`remove\` - Remove word from blacklist\n\`list\` - Show all blacklisted words`
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        const action = args[0].toLowerCase();

        if (action === 'list') {
            if (config.blacklistWords.length === 0) {
                const embed = EmbedHelper.info(
                    '📋 Blacklist',
                    'No words are blacklisted. Using default pattern detection only.'
                );
                return message.reply({ embeds: [embed] }).catch(() => {});
            }

            // Send as DM to avoid displaying profanity in channel
            try {
                const embed = EmbedHelper.info(
                    '📋 Blacklisted Words',
                    `${config.blacklistWords.join(', ')}\n\n**Total:** ${config.blacklistWords.length} words`
                );
                await message.author.send({ embeds: [embed] });
                
                const confirmEmbed = EmbedHelper.success(
                    '✅ List Sent',
                    'Blacklist sent to your DMs for privacy.'
                );
                return message.reply({ embeds: [confirmEmbed] }).catch(() => {});
            } catch (error) {
                const embed = EmbedHelper.error(
                    '❌ Cannot Send DM',
                    'Please enable DMs from server members.'
                );
                return message.reply({ embeds: [embed] }).catch(() => {});
            }
        }

        // For add/remove, we need a word
        if (!args[1]) {
            const embed = EmbedHelper.error(
                '❌ Missing Word',
                'Please provide a word to blacklist/unblacklist.'
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        const word = args[1].toLowerCase();

        if (action === 'add') {
            if (config.blacklistWords.includes(word)) {
                const embed = EmbedHelper.warning(
                    '⚠️ Already Blacklisted',
                    'This word is already in the blacklist.'
                );
                return message.reply({ embeds: [embed] }).catch(() => {});
            }

            config.blacklistWords.push(word);
            await this.saveConfig(message.guild.id, config);

            const embed = EmbedHelper.success(
                '✅ Word Blacklisted',
                `Added to blacklist. Messages containing this word will be flagged.`
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        if (action === 'remove') {
            const index = config.blacklistWords.indexOf(word);
            if (index === -1) {
                const embed = EmbedHelper.warning(
                    '⚠️ Not Found',
                    'This word is not in the blacklist.'
                );
                return message.reply({ embeds: [embed] }).catch(() => {});
            }

            config.blacklistWords.splice(index, 1);
            await this.saveConfig(message.guild.id, config);

            const embed = EmbedHelper.success(
                '✅ Word Removed',
                `Removed from blacklist.`
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }
    }
}

module.exports = BlacklistCommand;
