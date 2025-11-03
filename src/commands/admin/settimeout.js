const BaseCommand = require('../BaseCommand');
const EmbedHelper = require('../../utils/embedBuilder');
const { PermissionFlagsBits } = require('discord.js');

class SetTimeoutCommand extends BaseCommand {
    constructor(bot) {
        super(bot);
        this.name = 'settimeout';
        this.description = 'Set timeout duration for strikes';
        this.usage = 'n!settimeout <strike#> <duration>';
        this.aliases = ['timeoutduration', 'setduration'];
        this.adminOnly = true;
        this.requiredPermission = PermissionFlagsBits.Administrator;
    }

    async execute(message, args) {
        if (args.length < 2) {
            const config = await this.getConfig(message.guild.id);
            const durations = config.timeoutDurations || {};
            
            let durationList = '';
            for (let i = 1; i <= (config.maxStrikes || 3); i++) {
                if (durations[i]) {
                    durationList += `Strike ${i}: **${durations[i]}**\n`;
                }
            }
            
            const embed = EmbedHelper.info(
                '⏱️ Current Timeout Durations',
                `${durationList || 'No timeouts configured'}\n\n**Usage:** \`n!settimeout <strike#> <duration>\`\n\n**Duration Format:**\n\`10m\` = 10 minutes\n\`1h\` = 1 hour\n\`1d\` = 1 day\n\n**Examples:**\n\`n!settimeout 1 10m\`\n\`n!settimeout 2 1h\`\n\`n!settimeout 3 1d\``
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        const strikeNum = parseInt(args[0]);
        const duration = args[1];
        
        if (isNaN(strikeNum) || strikeNum < 1 || strikeNum > 10) {
            const embed = EmbedHelper.error(
                '❌ Invalid Strike Number',
                'Strike number must be between 1 and 10.'
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        // Validate duration format
        const durationMatch = duration.match(/^(\d+)([mhd])$/);
        if (!durationMatch) {
            const embed = EmbedHelper.error(
                '❌ Invalid Duration',
                'Duration must be in format: `10m`, `1h`, or `1d`'
            );
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        const config = await this.getConfig(message.guild.id);
        config.timeoutDurations = config.timeoutDurations || {};
        config.timeoutDurations[strikeNum] = duration;
        await this.saveConfig(message.guild.id, config);
        
        const embed = EmbedHelper.success(
            '✅ Timeout Duration Set',
            `Strike ${strikeNum} timeout duration: **${duration}**\n\nMake sure strike ${strikeNum} punishment is set to 'timeout' with \`n!setpunishment ${strikeNum} timeout\``
        );
        
        await message.reply({ embeds: [embed] }).catch(() => {});
    }
}

module.exports = SetTimeoutCommand;
