const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');

class PhishingCommand extends BaseCommand {
    constructor(bot) {
        super(bot, {
            name: 'phishing',
            description: 'Configure phishing detection settings',
            usage: 'phishing <strikes|punishment|timeout|detection> <args>',
            category: 'admin',
            adminOnly: true,
            requiredPermission: PermissionFlagsBits.Administrator
        });
    }

    async execute(message, args) {
        const Models = require('../../database/models/Config').Models;
        const models = new Models(this.bot.dbManager);
        
        const guildId = message.guild.id;
        let config = await models.guildConfig.get(guildId) || this.getDefaultConfig(guildId);

        const subcommand = args[0]?.toLowerCase();

        if (!subcommand) {
            return message.reply({ 
                embeds: [this.showPhishingConfig(config)] 
            });
        }

        switch (subcommand) {
            case 'strikes':
                return await this.handleStrikes(message, args, config, models);
            
            case 'punishment':
                return await this.handlePunishment(message, args, config, models);
            
            case 'timeout':
                return await this.handleTimeout(message, args, config, models);
            
            case 'detection':
                return await this.handleDetection(message, args, config, models);
            
            default:
                return message.reply({
                    embeds: [EmbedHelper.error(
                        '❌ Invalid Subcommand',
                        `Valid options: \`strikes\`, \`punishment\`, \`timeout\`, \`detection\`\n\nUsage: \`${this.usage}\``
                    )]
                });
        }
    }

    async handleStrikes(message, args, config, models) {
        const amount = parseInt(args[1]);

        if (isNaN(amount) || amount < 1 || amount > 10) {
            return message.reply({
                embeds: [EmbedHelper.error(
                    '❌ Invalid Amount',
                    'Please provide a number between 1 and 10'
                )]
            });
        }

        if (!config.phishing) {
            config.phishing = {};
        }

        config.phishing.maxStrikes = amount;
        await models.guildConfig.set(message.guild.id, config);

        return message.reply({
            embeds: [EmbedHelper.success(
                '✅ Phishing Strikes Updated',
                `Maximum phishing strikes set to **${amount}**`
            )]
        });
    }

    async handlePunishment(message, args, config, models) {
        const strikeNumber = parseInt(args[1]);
        const punishmentType = args[2]?.toLowerCase();

        if (isNaN(strikeNumber) || strikeNumber < 1 || strikeNumber > 10) {
            return message.reply({
                embeds: [EmbedHelper.error(
                    '❌ Invalid Strike Number',
                    'Please provide a strike number between 1 and 10'
                )]
            });
        }

        const validPunishments = ['warn', 'kick', 'ban', 'timeout'];
        if (!validPunishments.includes(punishmentType)) {
            return message.reply({
                embeds: [EmbedHelper.error(
                    '❌ Invalid Punishment',
                    `Valid punishments: ${validPunishments.map(p => `\`${p}\``).join(', ')}`
                )]
            });
        }

        if (!config.phishing) {
            config.phishing = {};
        }
        if (!config.phishing.punishments) {
            config.phishing.punishments = {};
        }

        config.phishing.punishments[strikeNumber] = punishmentType;
        await models.guildConfig.set(message.guild.id, config);

        return message.reply({
            embeds: [EmbedHelper.success(
                '✅ Phishing Punishment Updated',
                `Strike ${strikeNumber} punishment set to **${punishmentType}**`
            )]
        });
    }

    async handleTimeout(message, args, config, models) {
        const strikeNumber = parseInt(args[1]);
        const duration = args[2];

        if (isNaN(strikeNumber) || strikeNumber < 1 || strikeNumber > 10) {
            return message.reply({
                embeds: [EmbedHelper.error(
                    '❌ Invalid Strike Number',
                    'Please provide a strike number between 1 and 10'
                )]
            });
        }

        if (!duration || !duration.match(/^\d+[mhd]$/)) {
            return message.reply({
                embeds: [EmbedHelper.error(
                    '❌ Invalid Duration',
                    'Format: `10m`, `1h`, `1d`'
                )]
            });
        }

        if (!config.phishing) {
            config.phishing = {};
        }
        if (!config.phishing.timeouts) {
            config.phishing.timeouts = {};
        }

        config.phishing.timeouts[strikeNumber] = duration;
        await models.guildConfig.set(message.guild.id, config);

        return message.reply({
            embeds: [EmbedHelper.success(
                '✅ Phishing Timeout Updated',
                `Strike ${strikeNumber} timeout set to **${duration}**`
            )]
        });
    }

    async handleDetection(message, args, config, models) {
        const mode = args[1]?.toLowerCase();

        const validModes = ['strict', 'moderate', 'lenient'];
        if (!validModes.includes(mode)) {
            return message.reply({
                embeds: [EmbedHelper.error(
                    '❌ Invalid Detection Mode',
                    `Valid modes: ${validModes.map(m => `\`${m}\``).join(', ')}\n\n` +
                    `**Strict**: Block all suspicious links\n` +
                    `**Moderate**: Block known phishing and malware (default)\n` +
                    `**Lenient**: Only block confirmed threats`
                )]
            });
        }

        if (!config.phishing) {
            config.phishing = {};
        }

        config.phishing.detectionMode = mode;
        await models.guildConfig.set(message.guild.id, config);

        return message.reply({
            embeds: [EmbedHelper.success(
                '✅ Phishing Detection Mode Updated',
                `Detection mode set to **${mode}**`
            )]
        });
    }

    showPhishingConfig(config) {
        const phishing = config.phishing || {};
        
        const embed = EmbedHelper.info(
            '🛡️ Phishing Protection Configuration',
            'Current phishing detection settings'
        );

        embed.addFields([
            {
                name: '📊 Detection Settings',
                value: `**Mode**: ${phishing.detectionMode || 'moderate'}\n**Max Strikes**: ${phishing.maxStrikes || 3}`,
                inline: true
            },
            {
                name: '⚙️ Status',
                value: config.phishingDetection !== false ? '✅ Enabled' : '❌ Disabled',
                inline: true
            },
            {
                name: '\u200b',
                value: '\u200b',
                inline: true
            }
        ]);

        if (phishing.punishments && Object.keys(phishing.punishments).length > 0) {
            const punishmentsList = Object.entries(phishing.punishments)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([strike, type]) => `Strike ${strike}: **${type}**`)
                .join('\n');
            
            embed.addFields([{
                name: '⚖️ Punishment Ladder',
                value: punishmentsList,
                inline: false
            }]);
        }

        if (phishing.timeouts && Object.keys(phishing.timeouts).length > 0) {
            const timeoutsList = Object.entries(phishing.timeouts)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([strike, duration]) => `Strike ${strike}: **${duration}**`)
                .join('\n');
            
            embed.addFields([{
                name: '⏱️ Timeout Durations',
                value: timeoutsList,
                inline: false
            }]);
        }

        embed.addFields([{
            name: '📝 Commands',
            value: '`phishing strikes <1-10>` - Set max strikes\n' +
                   '`phishing punishment <strike#> <type>` - Set punishment\n' +
                   '`phishing timeout <strike#> <duration>` - Set timeout\n' +
                   '`phishing detection <mode>` - Set detection mode',
            inline: false
        }]);

        return embed;
    }

    getDefaultConfig(guildId) {
        return {
            guildId: guildId,
            enabled: false,
            phishing: {
                maxStrikes: 3,
                detectionMode: 'moderate',
                punishments: {
                    1: 'warn',
                    2: 'timeout',
                    3: 'kick'
                },
                timeouts: {
                    2: '1h'
                }
            }
        };
    }
}

module.exports = PhishingCommand;
