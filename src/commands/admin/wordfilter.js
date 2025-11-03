const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');

class WordFilterCommand extends BaseCommand {
    constructor(bot) {
        super(bot, {
            name: 'wordfilter',
            description: 'Advanced word filter management',
            usage: 'wordfilter <add|remove|list|test> [word/phrase]',
            category: 'admin',
            aliases: ['wf', 'filter'],
            adminOnly: true,
            requiredPermission: PermissionFlagsBits.Administrator
        });
    }

    async execute(message, args) {
        const Models = require('../../database/models/Config').Models;
        const models = new Models(this.bot.dbManager);
        
        const guildId = message.guild.id;
        let config = await models.guildConfig.get(guildId) || { guildId };

        if (!config.customWords) config.customWords = [];
        if (!config.blacklistedWords) config.blacklistedWords = [];

        const subcommand = args[0]?.toLowerCase();

        if (!subcommand) {
            return message.reply({
                embeds: [this.showFilterStats(config)]
            });
        }

        switch (subcommand) {
            case 'add':
                return await this.handleAdd(message, args, config, models);
            case 'remove':
                return await this.handleRemove(message, args, config, models);
            case 'list':
                return await this.handleList(message, config);
            case 'test':
                return await this.handleTest(message, args, config);
            default:
                return message.reply({
                    embeds: [EmbedHelper.error('❌ Invalid Subcommand', `Valid options: \`add\`, \`remove\`, \`list\`, \`test\``)]
                });
        }
    }

    async handleAdd(message, args, config, models) {
        const word = args.slice(1).join(' ').toLowerCase();

        if (!word) {
            return message.reply({
                embeds: [EmbedHelper.error('❌ Missing Word', 'Please provide a word or phrase to filter')]
            });
        }

        if (config.blacklistedWords.includes(word)) {
            return message.reply({
                embeds: [EmbedHelper.error('❌ Already Filtered', 'This word/phrase is already in the filter')]
            });
        }

        config.blacklistedWords.push(word);
        await models.guildConfig.set(message.guild.id, config);

        return message.reply({
            embeds: [EmbedHelper.success(
                '✅ Word Added to Filter',
                `Messages containing "${word}" will now be flagged\n\n**Total Filtered Words:** ${config.blacklistedWords.length}`
            )]
        });
    }

    async handleRemove(message, args, config, models) {
        const word = args.slice(1).join(' ').toLowerCase();

        if (!word) {
            return message.reply({
                embeds: [EmbedHelper.error('❌ Missing Word', 'Please provide a word or phrase to remove')]
            });
        }

        const index = config.blacklistedWords.indexOf(word);
        if (index === -1) {
            return message.reply({
                embeds: [EmbedHelper.error('❌ Not Found', 'This word/phrase is not in the filter')]
            });
        }

        config.blacklistedWords.splice(index, 1);
        await models.guildConfig.set(message.guild.id, config);

        return message.reply({
            embeds: [EmbedHelper.success(
                '✅ Word Removed from Filter',
                `"${word}" has been removed from the filter\n\n**Total Filtered Words:** ${config.blacklistedWords.length}`
            )]
        });
    }

    async handleList(message, config) {
        if (config.blacklistedWords.length === 0) {
            return message.reply({
                embeds: [EmbedHelper.info('📋 Word Filter', 'No custom filtered words configured')]
            });
        }

        const pages = [];
        const wordsPerPage = 20;
        
        for (let i = 0; i < config.blacklistedWords.length; i += wordsPerPage) {
            const pageWords = config.blacklistedWords.slice(i, i + wordsPerPage);
            const wordList = pageWords.map((word, index) => `${i + index + 1}. ${word}`).join('\n');
            
            const embed = EmbedHelper.info(
                `📋 Filtered Words (${i + 1}-${Math.min(i + wordsPerPage, config.blacklistedWords.length)} of ${config.blacklistedWords.length})`,
                wordList || 'No words on this page'
            );
            
            pages.push(embed);
        }

        return message.reply({ embeds: [pages[0]] });
    }

    async handleTest(message, args, config) {
        const testPhrase = args.slice(1).join(' ').toLowerCase();

        if (!testPhrase) {
            return message.reply({
                embeds: [EmbedHelper.error('❌ Missing Test Phrase', 'Please provide a phrase to test')]
            });
        }

        const matchedWords = config.blacklistedWords.filter(word => 
            testPhrase.includes(word.toLowerCase())
        );

        if (matchedWords.length === 0) {
            return message.reply({
                embeds: [EmbedHelper.success(
                    '✅ Test Passed',
                    `No filtered words detected in: "${testPhrase}"`
                )]
            });
        } else {
            return message.reply({
                embeds: [EmbedHelper.warning(
                    '⚠️ Test Failed',
                    `**Matched Filters:** ${matchedWords.map(w => `\`${w}\``).join(', ')}\n\n` +
                    `This message would be flagged for containing filtered words`
                )]
            });
        }
    }

    showFilterStats(config) {
        const embed = EmbedHelper.info(
            '🔍 Word Filter Configuration',
            'Manage custom word filters for this server'
        );

        embed.addFields([
            {
                name: '📊 Statistics',
                value: `**Custom Filtered Words:** ${config.blacklistedWords?.length || 0}\n` +
                       `**Whitelisted Words:** ${config.whitelistedWords?.length || 0}`,
                inline: false
            },
            {
                name: '📝 Commands',
                value: '`wordfilter add <word>` - Add word to filter\n' +
                       '`wordfilter remove <word>` - Remove word from filter\n' +
                       '`wordfilter list` - View all filtered words\n' +
                       '`wordfilter test <phrase>` - Test a phrase',
                inline: false
            }
        ]);

        return embed;
    }
}

module.exports = WordFilterCommand;
